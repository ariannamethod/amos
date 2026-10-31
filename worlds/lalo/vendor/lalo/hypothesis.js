// A named, inspectable rule over the two-clock journal.
export const RULE = 'unanimous-boolean/v1';
export const MAGNITUDE_RULE = 'magnitude-at-least/v1';

export function magnitudeHypothesis(ledger, { subject, validAt, knownAt, threshold = 3 }) {
  if (typeof threshold !== 'number' || !Number.isFinite(threshold)) throw new TypeError('threshold must be finite');
  const claims = ledger.asOf({ subject, predicate: 'magnitude', validAt, knownAt });
  if (claims.some(f => f.value !== null && (typeof f.value !== 'number' || !Number.isFinite(f.value))))
    throw new TypeError('magnitude-at-least requires numeric or explicit null premises');
  const supporting = claims.filter(f => f.value !== null && f.value >= threshold);
  const opposing = claims.filter(f => f.value !== null && f.value < threshold);
  const unknown = claims.filter(f => f.value === null);
  const state = supporting.length && opposing.length ? 'contested'
    : !claims.length || unknown.length ? 'unsettled' : supporting.length ? 'supported' : 'contradicted';
  return { rule: MAGNITUDE_RULE, subject, predicate: 'magnitude', threshold, validAt, knownAt,
    state, supporting, opposing, unknown, premises: claims.map(f => f.id),
    validFrom: claims.length ? Math.max(...claims.map(f => f.validFrom)) : null,
    validTo: claims.reduce((end, f) => f.validTo === null ? end
      : end === null ? f.validTo : Math.min(end, f.validTo), null) };
}

export function hypothesis(ledger, { subject, predicate, expected = true, validAt, knownAt }) {
  if (typeof expected !== 'boolean') throw new TypeError('expected must be boolean');
  const claims = ledger.asOf({ subject, predicate, validAt, knownAt });
  if (claims.some(f => typeof f.value !== 'boolean'))
    throw new TypeError('unanimous-boolean requires boolean premises');
  const supporting = claims.filter(f => f.value === expected);
  const opposing = claims.filter(f => f.value !== expected);
  const state = !claims.length ? 'unsettled' : !opposing.length ? 'supported'
    : !supporting.length ? 'contradicted' : 'contested';
  return {
    rule: RULE, subject, predicate, expected, validAt, knownAt, state,
    supporting, opposing, premises: claims.map(f => f.id),
    validFrom: claims.length ? Math.max(...claims.map(f => f.validFrom)) : null,
    validTo: claims.length ? claims.reduce((end, f) => f.validTo === null ? end
      : end === null ? f.validTo : Math.min(end, f.validTo), null) : null,
  };
}

// A projection is rebuilt from receipts; future knowledge cannot enter its layers.
export function worldView(ledger, query) {
  const current = hypothesis(ledger, query);
  const history = ledger.entries().filter(f => f.recordedAt <= query.knownAt
    && f.subject === query.subject && f.predicate === query.predicate);
  const replaced = new Set(history.map(f => f.supersedes).filter(Boolean));
  const active = new Set(current.premises);
  const times = [...new Set(history.map(f => f.recordedAt))];
  return {
    current,
    records: history.map(f => ({ fact: f, state: active.has(f.id)
      ? f.value === current.expected ? 'supporting' : 'opposing'
      : replaced.has(f.id) ? 'superseded' : 'outside interval' })),
    layers: times.map(knownAt => hypothesis(ledger, { ...query, knownAt })),
    corrections: history.filter(f => f.supersedes).map(f => ({ from: f.supersedes, to: f.id })),
  };
}
