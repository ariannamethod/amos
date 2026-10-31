import { encodeJournal, decodeJournal } from '../journal.js';

export const LOCATION_BUDGET = Object.freeze({ capacity: 768, maxBytes: 512_000 });
export const LOCATION_SUBJECT = 'device:this-browser';
export const LOCATION_SOURCE = 'browser:geolocation';
const fields = ['latitude', 'longitude', 'accuracy'];

function measurement(position) {
  const { latitude, longitude, accuracy } = position?.coords || {};
  if (!Number.isFinite(latitude) || Math.abs(latitude) > 90
    || !Number.isFinite(longitude) || Math.abs(longitude) > 180
    || !Number.isFinite(accuracy) || accuracy < 0)
    throw new TypeError('Location requires valid latitude, longitude and accuracy in metres');
  if (!Number.isSafeInteger(position.timestamp) || position.timestamp < 0
    || position.timestamp >= Number.MAX_SAFE_INTEGER)
    throw new TypeError('Location timestamp must be integer Unix milliseconds');
  return { latitude, longitude, accuracy };
}

// One fix is three scalar receipts at one observed instant, never an assertion
// that the device remains there. A later fix appends; it does not correct a trip.
export function appendLocation(ledger, position, { id, receivedAt, ...budget } = {}) {
  const values = measurement(position);
  if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,96}$/.test(id))
    throw new TypeError('Location id must be 1–96 letters, digits, underscores or hyphens');
  const limits = { ...LOCATION_BUDGET, ...budget };
  const next = decodeJournal(encodeJournal(ledger, limits), limits);
  locationSamples(next);
  for (const predicate of fields) next.add({
    id: `location:${id}:${predicate}`, subject: LOCATION_SUBJECT, predicate,
    value: values[predicate], source: LOCATION_SOURCE,
    validFrom: position.timestamp, validTo: position.timestamp + 1, recordedAt: receivedAt,
  });
  encodeJournal(next, limits);
  return next;
}

export function locationSamples(ledger) {
  const records = ledger.entries(), samples = [];
  if (records.length % 3) throw new Error('Incomplete location receipt group');
  for (let i = 0; i < records.length; i += 3) {
    const group = records.slice(i, i + 3), first = group[0];
    const prefix = first.id.match(/^location:([A-Za-z0-9_-]{1,96}):latitude$/)?.[1];
    if (!prefix || group.some((f, j) => f.id !== `location:${prefix}:${fields[j]}`
      || f.predicate !== fields[j] || f.subject !== LOCATION_SUBJECT || f.source !== LOCATION_SOURCE
      || f.validFrom !== first.validFrom || f.validTo !== first.validFrom + 1
      || f.recordedAt !== first.recordedAt || f.supersedes !== null))
      throw new Error('Invalid location receipt group');
    const coords = Object.fromEntries(group.map(f => [f.predicate, f.value]));
    measurement({ coords, timestamp: first.validFrom });
    samples.push({ ...coords, observedAt: first.validFrom, receivedAt: first.recordedAt,
      id: first.id, records: group });
  }
  return samples;
}
