import { encodeJournal, decodeJournal } from './journal.js';
import { hypothesis, magnitudeHypothesis, RULE, MAGNITUDE_RULE } from './hypothesis.js';

export const TOOL_BUDGET = Object.freeze({ capacity: 1024, maxBytes: 2_000_000,
  maxResultBytes: 65_536, maxPage: 64, maxArgumentBytes: 32_768 });
const timestamp = description => ({ type: 'integer', minimum: Number.MIN_SAFE_INTEGER, maximum: Number.MAX_SAFE_INTEGER, description });
const name = description => ({ type: 'string', description: `${description} Nonblank; at most 512 UTF-16 code units.` });
const clocks = { knownAt: timestamp('Knowledge cutoff, integer Unix milliseconds; no receipt after this instant is visible.'),
  validAt: timestamp('World instant, integer Unix milliseconds; intervals are [validFrom, validTo).') };
const paging = { offset: { type: 'integer', minimum: 0, maximum: 1024, default: 0, description: 'Resume at nextOffset with the same arguments and session.' },
  limit: { type: 'integer', minimum: 1, maximum: 64, default: 32, description: 'Maximum rows; the byte budget may return fewer. Follow nextOffset.' } };
const filters = { subject: name('Exact subject.'), predicate: name('Exact predicate.'),
  source: { type: 'string', description: 'Exact source. Nonblank; at most 4096 UTF-16 code units.' } };
const define = (name, description, properties, required = []) => ({ name, description,
  parameters: { type: 'object', properties, required, additionalProperties: false } });
// Only flat primitive arguments: also accepted by the existing WOLFE schema subset.
const definitions = [
  define('lalo_status', 'Read fixed session metadata and budgets. Receipt bounds describe the complete loaded snapshot.', {}),
  define('lalo_subjects', 'Discover subjects known at a receipt cutoff, with receipt counts and world-time bounds. Includes historical assertions.',
    { knownAt: clocks.knownAt, prefix: name('Subject prefix.'), ...paging }, ['knownAt']),
  define('lalo_facts', 'Read active facts through both clocks, retaining source and predecessor IDs.',
    { ...clocks, ...filters, ...paging }, ['knownAt', 'validAt']),
  define('lalo_history', 'Read the append-only receipt history up to knownAt, including superseded assertions and their world intervals.',
    { knownAt: clocks.knownAt, ...filters, ...paging }, ['knownAt']),
  define('lalo_lineage', 'Follow a known receipt from its original assertion to the requested revision. Future and unknown IDs return NOT_FOUND.',
    { id: name('Receipt ID.'), knownAt: clocks.knownAt, ...paging }, ['id', 'knownAt']),
  define('lalo_reading', 'Evaluate a named rule over ALL active premises. Page through its evidence; the conclusion always uses the complete premise set. Boolean uses expected (default true); magnitude uses threshold (default 3) and predicate magnitude.',
    { ...clocks, subject: filters.subject, predicate: filters.predicate,
      rule: { type: 'string', enum: [RULE, MAGNITUDE_RULE] }, expected: { type: 'boolean' }, threshold: { type: 'number' }, ...paging },
    ['knownAt', 'validAt', 'subject', 'predicate', 'rule']),
];
export const listTools = () => JSON.parse(JSON.stringify(definitions));
const bytes = value => new TextEncoder().encode(JSON.stringify(value)).byteLength;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value)
  && [Object.prototype, null].includes(Object.getPrototypeOf(value));
class ToolError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}
function invalid(message) { throw new ToolError('INVALID_ARGUMENTS', message); }
function argumentsFor(tool, input) {
  if (!object(input)) invalid('arguments must be an object');
  const schema = tool.parameters, args = {};
  for (const key of Object.keys(input)) if (!Object.hasOwn(schema.properties, key)) invalid(`Unknown argument: ${key.slice(0, 80)}`);
  for (const key of schema.required) if (!Object.hasOwn(input, key)) invalid(`Missing argument: ${key}`);
  for (const [key, spec] of Object.entries(schema.properties)) {
    const value = Object.hasOwn(input, key) ? input[key] : spec.default;
    if (value === undefined && !Object.hasOwn(input, key)) continue;
    if (spec.type === 'integer' ? !Number.isSafeInteger(value)
      : spec.type === 'number' ? typeof value !== 'number' || !Number.isFinite(value)
      : typeof value !== spec.type) invalid(`${key} must be ${spec.type}`);
    if (typeof value === 'string' && (!value.trim() || value.length > (key === 'source' ? 4096 : 512)))
      invalid(`${key} is empty or exceeds its text budget`);
    if (spec.minimum !== undefined && value < spec.minimum || spec.maximum !== undefined && value > spec.maximum)
      invalid(`${key} is outside its declared bounds`);
    if (spec.enum && !spec.enum.includes(value)) invalid(`${key} is not a supported value`);
    args[key] = value;
  }
  if (bytes(args) > TOOL_BUDGET.maxArgumentBytes) invalid('arguments exceed their byte budget');
  return args;
}

// Each host owns a fixed snapshot, so pagination and repeated calls cannot drift.
// AMOS extension: explicit session budgets; upstream defaults remain unchanged.
export function createToolHost(world, { maxResultBytes = TOOL_BUDGET.maxResultBytes,
  capacity = TOOL_BUDGET.capacity, maxBytes = TOOL_BUDGET.maxBytes } = {}) {
  if (!Number.isSafeInteger(capacity) || capacity < 1 || capacity > 16384 ||
    !Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > 32_000_000)
    throw new RangeError('invalid session journal budget');
  const sessionDefinitions = listTools();
  for (const tool of sessionDefinitions) if (tool.parameters.properties.offset)
    tool.parameters.properties.offset.maximum = capacity;
  if (!Number.isSafeInteger(maxResultBytes) || maxResultBytes < 1024 || maxResultBytes > TOOL_BUDGET.maxResultBytes)
    throw new RangeError('result byte budget must be between 1024 and 65536');
  const ledger = decodeJournal(encodeJournal(world, { maxBytes }), { capacity, maxBytes }), all = ledger.entries();
  const known = at => all.filter(f => f.recordedAt <= at);
  const match = (f, a) => ['subject', 'predicate', 'source'].every(k => a[k] === undefined || f[k] === a[k]);
  function page(rows, args, extra = {}) {
    if (args.offset > rows.length) invalid('offset exceeds this result; keep the query and session unchanged');
    const data = { ...extra, items: [], total: rows.length, offset: args.offset, nextOffset: null, complete: false };
    const result = { ok: true, data };
    for (let i = args.offset; i < Math.min(rows.length, args.offset + args.limit); i++) {
      data.items.push(rows[i]);
      // Reserve the actual continuation fields when measuring the whole envelope.
      data.nextOffset = capacity; data.complete = false;
      if (bytes(result) > maxResultBytes) { data.items.pop(); break; }
    }
    const end = args.offset + data.items.length;
    data.complete = end === rows.length; data.nextOffset = data.complete ? null : end;
    if (!data.items.length && !data.complete) throw new ToolError('RESULT_BUDGET', 'One result row exceeds the byte budget; request a larger host budget');
    return result;
  }
  function execute(tool, a) {
    if (tool === 'lalo_status') return { ok: true, data: { snapshot: 'fixed for this host session', records: all.length,
      firstReceipt: all[0]?.recordedAt ?? null, latestReceipt: all.at(-1)?.recordedAt ?? null,
      limits: { ...TOOL_BUDGET, capacity, maxBytes, maxResultBytes } } };
    if (tool === 'lalo_subjects') {
      const subjects = new Map();
      for (const f of known(a.knownAt)) {
        if (a.prefix !== undefined && !f.subject.startsWith(a.prefix)) continue;
        const s = subjects.get(f.subject) || { subject: f.subject, receipts: 0, firstReceipt: f.recordedAt,
          latestReceipt: f.recordedAt, validFromMin: f.validFrom, validFromMax: f.validFrom };
        s.receipts++; s.latestReceipt = f.recordedAt;
        s.validFromMin = Math.min(s.validFromMin, f.validFrom); s.validFromMax = Math.max(s.validFromMax, f.validFrom);
        subjects.set(f.subject, s);
      }
      const rows = [...subjects.values()].sort((x, y) => x.subject < y.subject ? -1 : x.subject > y.subject ? 1 : 0);
      return page(rows, a, { knownAt: a.knownAt });
    }
    if (tool === 'lalo_facts') return page(ledger.asOf(a).filter(f => match(f, a)), a, { validAt: a.validAt, knownAt: a.knownAt });
    if (tool === 'lalo_history') return page(known(a.knownAt).filter(f => match(f, a)), a, { knownAt: a.knownAt });
    if (tool === 'lalo_lineage') {
      if (!known(a.knownAt).some(f => f.id === a.id)) throw new ToolError('NOT_FOUND', 'Receipt is not known at this cutoff');
      return page(ledger.lineage(a.id), a, { id: a.id, knownAt: a.knownAt });
    }
    if (a.rule === RULE && a.threshold !== undefined) invalid('threshold belongs to magnitude-at-least/v1');
    if (a.rule === MAGNITUDE_RULE && (a.expected !== undefined || a.predicate !== 'magnitude'))
      invalid('magnitude-at-least/v1 requires predicate magnitude and uses threshold, not expected');
    let reading;
    try { reading = a.rule === RULE ? hypothesis(ledger, a) : magnitudeHypothesis(ledger, a); }
    catch (error) { throw new ToolError('INVALID_PREMISES', error.message); }
    const { supporting, opposing, unknown = [], premises, ...summary } = reading;
    const roles = new Map([...supporting.map(f => [f.id, 'supporting']), ...opposing.map(f => [f.id, 'opposing']), ...unknown.map(f => [f.id, 'unknown'])]);
    const byID = new Map(all.map(f => [f.id, f]));
    return page(premises.map(id => ({ role: roles.get(id), fact: byID.get(id) })), a,
      { reading: { ...summary, premiseCount: premises.length, counts: { supporting: supporting.length, opposing: opposing.length, unknown: unknown.length } } });
  }
  return Object.freeze({ list: () => JSON.parse(JSON.stringify(sessionDefinitions)), call(name, input = {}) {
    try {
      const tool = sessionDefinitions.find(t => t.name === name);
      if (!tool) throw new ToolError('UNKNOWN_TOOL', 'Tool is not registered');
      const args = argumentsFor(tool, input), result = execute(name, args);
      if (bytes(result) > maxResultBytes) throw new ToolError('RESULT_BUDGET', 'Result exceeds the host byte budget');
      return JSON.parse(JSON.stringify(result));
    } catch (error) {
      return { ok: false, error: { code: error?.code || 'TOOL_FAILURE', message: String(error?.message || 'Tool call failed').slice(0, 400) } };
    }
  } });
}
