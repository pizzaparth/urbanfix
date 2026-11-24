// User input placed inside a MongoDB $regex must be matched literally. Without
// escaping, a filter such as `(a+)+$` is executed as a pattern (slow-regex denial
// of service) and `.*` matches everything.
const MAX_SEARCH_LENGTH = 100;

export const escapeRegex = (value) =>
  String(value)
    .slice(0, MAX_SEARCH_LENGTH)
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const containsInsensitive = (value) => ({ $regex: escapeRegex(value), $options: 'i' });
