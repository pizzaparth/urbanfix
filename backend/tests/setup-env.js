// Imported first by every test file, before any application module reads the
// environment.
import os from 'os';
import path from 'path';
import fs from 'fs';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-not-used-anywhere-else-0001';
process.env.RESEARCH_HMAC_KEY = 'test-research-hmac-key-0123456789abcdef0123456789';
process.env.UPLOAD_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'urbanfix-uploads-'));
process.env.DISABLE_JOBS = 'true';
process.env.AI_RETRY_DELAY_MS = '10';
process.env.AI_TIMEOUT_MS = '3000';
delete process.env.AI_SERVICE_URL;
delete process.env.RATE_LIMIT_SCALE;
