// Checks the secrets the server cannot run safely without. Called once at start-up,
// before the database connection, so a misconfigured deployment fails loudly instead
// of quietly falling back to a weak default.

const MIN_KEY_BYTES = 32;

export const assertRequiredEnv = (env = process.env) => {
  const problems = [];

  if (!env.JWT_SECRET) {
    problems.push('JWT_SECRET is not set.');
  }

  const researchKey = env.RESEARCH_HMAC_KEY;
  if (!researchKey) {
    problems.push('RESEARCH_HMAC_KEY is not set. Generate one with: openssl rand -hex 32');
  } else if (Buffer.byteLength(researchKey, 'utf8') < MIN_KEY_BYTES) {
    problems.push(`RESEARCH_HMAC_KEY must be at least ${MIN_KEY_BYTES} bytes long.`);
  } else if (researchKey === env.JWT_SECRET) {
    problems.push('RESEARCH_HMAC_KEY must differ from JWT_SECRET (one key per purpose).');
  }

  if (problems.length > 0) {
    throw new Error(`Refusing to start:\n  - ${problems.join('\n  - ')}`);
  }
};
