import { FactLedger } from './ledger.js';

const FORMAT = 'lalo/journal';
export function encodeJournal(ledger, { maxBytes = 2_000_000 } = {}) {
  const text = JSON.stringify({ format: FORMAT, version: 1, records: ledger.entries() });
  checkSize(text, maxBytes);
  return text;
}
function checkSize(text, maxBytes) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) throw new RangeError('invalid byte budget');
  if (typeof text !== 'string') throw new TypeError('journal must be JSON text');
  if (text.length > maxBytes || new TextEncoder().encode(text).length > maxBytes)
    throw new RangeError('journal exceeds byte budget');
}
export function decodeJournal(text, { capacity = 1024, maxBytes = 2_000_000 } = {}) {
  checkSize(text, maxBytes);
  const data = JSON.parse(text);
  if (!data || data.format !== FORMAT || data.version !== 1 || !Array.isArray(data.records))
    throw new TypeError('unsupported journal format or version');
  const ledger = new FactLedger({ capacity });
  if (data.records.length > capacity) throw new RangeError('journal exceeds record budget');
  for (const record of data.records) ledger.add(record);
  return ledger;
}
