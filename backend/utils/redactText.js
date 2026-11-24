// Removes common personal identifiers from free text before it is stored, because
// complaint titles, descriptions, locations and staff remarks are published in the
// open registry and the tracker. Only the redacted text is kept.
//
// Covered: email addresses, UPI IDs, Indian mobile numbers, Aadhaar-like 12-digit
// numbers, PAN numbers and Indian vehicle registration numbers.
// Not covered: personal names. They cannot be found reliably with patterns, so the
// filing screen asks citizens not to write them (residual risk, stated in the paper).

export const REDACTION_MARK = '[removed]';

// Order matters: longer numeric identifiers are removed before shorter ones, so a
// 12-digit Aadhaar number is not half-matched as a 10-digit phone number.
const PATTERNS = [
  { kind: 'email', re: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi },
  { kind: 'upi', re: /\b[A-Z0-9._-]{2,}@[A-Z]{2,}\b/gi },
  { kind: 'aadhaar', re: /(?<!\d)\d{4}[\s-]?\d{4}[\s-]?\d{4}(?!\d)/g },
  { kind: 'phone', re: /(?:\+?91[\s-]?|(?<!\d)0)?(?<!\d)[6-9]\d{4}[\s-]?\d{5}(?!\d)/g },
  { kind: 'pan', re: /\b[A-Z]{5}\d{4}[A-Z]\b/g },
  { kind: 'vehicle', re: /\b[A-Z]{2}[\s-]?\d{1,2}[\s-]?[A-Z]{1,3}[\s-]?\d{4}\b/g },
];

export const redactText = (text) => {
  if (typeof text !== 'string' || text.length === 0) return text;
  return PATTERNS.reduce((out, { re }) => out.replace(re, REDACTION_MARK), text);
};

// Which kinds of identifier a text contains. Used by tests and by the privacy analysis.
export const findIdentifiers = (text) =>
  PATTERNS.filter(({ re }) => new RegExp(re.source, re.flags).test(String(text))).map(({ kind }) => kind);
