import { encodeJournal, decodeJournal } from '../journal.js';

export const USGS_FEED = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson';
const fields = ['magnitude', 'magnitude_type', 'longitude', 'latitude', 'depth_km', 'place', 'event_type', 'source_updated_at'];
function integer(value, name) {
  if (!Number.isSafeInteger(value)) throw new TypeError(`${name} must be an integer timestamp`);
  return value;
}
function number(value, name) {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new TypeError(`${name} must be finite`);
  return value;
}
function text(value, name) {
  if (value !== null && (typeof value !== 'string' || value.length > 4096))
    throw new TypeError(`${name} must be text or explicit null`);
  return value;
}
function event(feature) {
  if (feature?.type !== 'Feature' || typeof feature.id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(feature.id))
    throw new TypeError('invalid USGS feature ID');
  const p = feature.properties, g = feature.geometry;
  if (!p || g?.type !== 'Point' || !Array.isArray(g.coordinates) || g.coordinates.length !== 3)
    throw new TypeError('invalid USGS properties or point');
  const time = integer(p.time, 'event time'), updated = integer(p.updated, 'source update');
  if (!Number.isSafeInteger(time + 1)) throw new RangeError('event time is out of range');
  const [lon, lat, depth] = g.coordinates.map((v, i) => number(v, ['longitude', 'latitude', 'depth'][i]));
  if (Math.abs(lon) > 180 || Math.abs(lat) > 90) throw new RangeError('invalid coordinates');
  return { id: feature.id, time, updated, values: [
    p.mag === null ? null : number(p.mag, 'magnitude'), text(p.magType, 'magnitude type'),
    lon, lat, depth, text(p.place, 'place'), text(p.type, 'event type'), updated,
  ] };
}

// The standalone source field accepts complete adapter journals, including every old version.
export function validateUSGSJournal(ledger) {
  const rows = ledger.entries(), heads = new Map();
  if (rows.length % fields.length) throw new Error('incomplete USGS journal version');
  for (let offset = 0; offset < rows.length; offset += fields.length) {
    const group = rows.slice(offset, offset + fields.length), first = group[0];
    const values = group.map(f => f.value), id = first.subject.slice(5), updated = values[7];
    const e = event({ type: 'Feature', id, geometry: { type: 'Point', coordinates: values.slice(2, 5) },
      properties: { mag: values[0], magType: values[1], place: values[5], type: values[6], time: first.validFrom, updated } });
    const subject = `usgs:${e.id}`, source = `https://earthquake.usgs.gov/earthquakes/eventpage/${e.id}`;
    const previous = heads.get(subject);
    if (previous !== undefined && updated <= previous) throw new Error('USGS source versions must advance');
    for (let i = 0; i < fields.length; i++) {
      const f = group[i], predicate = fields[i];
      if (f.subject !== subject || f.source !== source || f.predicate !== predicate
        || f.id !== `${subject}:${updated}:${predicate}` || f.recordedAt !== first.recordedAt
        || f.validFrom !== e.time || f.validTo !== e.time + 1
        || f.supersedes !== (previous === undefined ? null : `${subject}:${previous}:${predicate}`))
        throw new Error('USGS journal contains an inconsistent event version');
    }
    heads.set(subject, updated);
  }
  return ledger;
}

// A whole poll is staged on a new ledger. On failure the caller retains its prior journal.
export function ingestUSGS(ledger, feed, { receivedAt, capacity = 1024, maxEvents = 500 } = {}) {
  integer(receivedAt, 'receipt time');
  if (!Number.isSafeInteger(maxEvents) || maxEvents < 1) throw new RangeError('invalid event budget');
  if (feed?.type !== 'FeatureCollection' || !Array.isArray(feed.features))
    throw new TypeError('USGS feed must be a FeatureCollection');
  if (feed.features.length > maxEvents) throw new RangeError('USGS feed exceeds event budget');
  const events = feed.features.map(event);
  if (new Set(events.map(e => e.id)).size !== events.length) throw new Error('duplicate event in USGS feed');
  const candidate = decodeJournal(encodeJournal(ledger), { capacity });
  const existing = new Map(candidate.entries().map(f => [f.id, f]));
  const latest = new Map();
  for (const fact of candidate.entries()) {
    if (fact.subject.startsWith('usgs:') && fact.predicate === 'source_updated_at') latest.set(fact.subject, fact);
  }
  const summary = { events: events.length, added: 0, revised: 0, unchanged: 0, stale: 0 };
  for (const e of events) {
    const subject = `usgs:${e.id}`, source = `https://earthquake.usgs.gov/earthquakes/eventpage/${e.id}`;
    const previous = latest.get(subject);
    if (previous) {
      if (!Number.isSafeInteger(previous.value) || previous.source !== source)
        throw new Error('invalid prior USGS source revision');
      for (const field of fields) {
        const old = existing.get(`${subject}:${previous.value}:${field}`);
        if (!old || old.subject !== subject || old.predicate !== field || old.source !== source)
          throw new Error('incomplete prior USGS event revision');
      }
      if (e.updated < previous.value) { summary.stale++; continue; }
    }
    if (previous?.value === e.updated) {
      for (let i = 0; i < fields.length; i++) {
        const old = existing.get(`${subject}:${e.updated}:${fields[i]}`);
        if (old.value !== e.values[i] || old.validFrom !== e.time || old.validTo !== e.time + 1)
          throw new Error('USGS changed an event without changing its source version');
      }
      summary.unchanged++; continue;
    }
    for (let i = 0; i < fields.length; i++) {
      const predicate = fields[i];
      candidate.add({ id: `${subject}:${e.updated}:${predicate}`, subject, predicate,
        value: e.values[i], source, validFrom: e.time, validTo: e.time + 1, recordedAt: receivedAt,
        supersedes: previous ? `${subject}:${previous.value}:${predicate}` : null });
    }
    summary[previous ? 'revised' : 'added']++;
  }
  return { ledger: candidate, summary };
}
