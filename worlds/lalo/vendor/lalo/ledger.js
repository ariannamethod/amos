// LALO's first organ: explicit observations, two clocks, unbroken lineage.
// No ambient clock, I/O, framework, or numerical backend.

function text(value, name, limit = 512) {
  if (typeof value !== 'string' || !value.trim() || value.length > limit)
    throw new TypeError(`${name} must be nonblank text of at most ${limit} code units`);
  return value;
}

function time(value, name) {
  if (!Number.isSafeInteger(value))
    throw new TypeError(`${name} must be an integer Unix timestamp in milliseconds`);
  return value;
}

function scalar(value) {
  if (value === null || typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.length <= 4096) return value;
  throw new TypeError('value must be null, boolean, finite number, or text up to 4096 code units');
}

/**
 * An in-memory journal with an explicit record budget. A fact's world interval
 * is [validFrom, validTo); null validTo means open-ended. recordedAt is when
 * LALO learned the assertion, not when the source observed the world.
 *
 * Corrections replace an entire assertion at their recordedAt. They never edit
 * the earlier row. Independent assertions coexist, including disagreements.
 */
export class FactLedger {
  #records = new Map();
  #replacedBy = new Map();
  #capacity;
  #latest = -Infinity;

  constructor({ capacity = 1024 } = {}) {
    if (!Number.isSafeInteger(capacity) || capacity < 1)
      throw new RangeError('capacity must be a positive safe integer');
    this.#capacity = capacity;
  }

  get size() { return this.#records.size; }

  /** Append one assertion. All validation finishes before journal mutation. */
  add(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input))
      throw new TypeError('fact must be an object');
    const fact = Object.freeze({
      id: text(input.id, 'id'),
      subject: text(input.subject, 'subject'),
      predicate: text(input.predicate, 'predicate'),
      value: scalar(input.value),
      source: text(input.source, 'source', 4096),
      validFrom: time(input.validFrom, 'validFrom'),
      validTo: input.validTo === null ? null : time(input.validTo, 'validTo'),
      recordedAt: time(input.recordedAt, 'recordedAt'),
      supersedes: input.supersedes == null ? null : text(input.supersedes, 'supersedes'),
    });
    if (fact.validTo !== null && fact.validTo <= fact.validFrom)
      throw new RangeError('validTo must be after validFrom');
    if (this.#records.has(fact.id)) throw new Error(`duplicate fact: ${fact.id}`);
    if (fact.recordedAt < this.#latest)
      throw new RangeError('recordedAt must follow journal order; backdate validFrom for late observations');
    if (fact.supersedes !== null) {
      const previous = this.#records.get(fact.supersedes);
      if (!previous) throw new Error(`unknown predecessor: ${fact.supersedes}`);
      if (this.#replacedBy.has(previous.id))
        throw new Error('correct the latest revision; independent claims need their own lineage');
      if (fact.subject !== previous.subject || fact.predicate !== previous.predicate)
        throw new Error('a correction must retain its subject and predicate');
      // AMOS extension: append position orders corrections within one receipt millisecond.
      if (fact.recordedAt < previous.recordedAt)
        throw new RangeError('a correction must not precede its predecessor');
    }
    if (this.size >= this.#capacity)
      throw new RangeError('journal capacity reached; export history before choosing another storage budget');
    this.#records.set(fact.id, fact);
    if (fact.supersedes !== null) this.#replacedBy.set(fact.supersedes, fact.id);
    this.#latest = fact.recordedAt;
    return fact;
  }

  /** Return claims valid at world time, using only knowledge available then. */
  asOf({ validAt, knownAt, subject, predicate }) {
    time(validAt, 'validAt');
    time(knownAt, 'knownAt');
    if (subject !== undefined) text(subject, 'subject');
    if (predicate !== undefined) text(predicate, 'predicate');
    return this.entries().filter(fact => {
      const replacement = this.#records.get(this.#replacedBy.get(fact.id));
      return fact.recordedAt <= knownAt
        && !(replacement && replacement.recordedAt <= knownAt)
        && fact.validFrom <= validAt
        && (fact.validTo === null || validAt < fact.validTo)
        && (subject === undefined || fact.subject === subject)
        && (predicate === undefined || fact.predicate === predicate);
    });
  }

  /** Original assertion through the requested revision, in chronological order. */
  lineage(id) {
    let fact = this.#records.get(id);
    if (!fact) throw new Error(`unknown fact: ${id}`);
    const chain = [];
    while (fact) {
      chain.push(fact);
      fact = this.#records.get(fact.supersedes);
    }
    return chain.reverse();
  }

  /** Detached array of immutable scalar records; includes replaced assertions. */
  entries() { return [...this.#records.values()]; }
}
