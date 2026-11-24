import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import dotenv from 'dotenv';
import { uploadDir } from '../config/paths.js';

// One-off migration: removes EXIF/XMP/IPTC metadata from photos uploaded before
// stripImageMetadata existed. Rewrites files in place. Run once with
// `node scripts/stripExistingUploads.js`; add --dry-run to only count them.
dotenv.config();

const FORMAT = { '.jpg': 'jpeg', '.jpeg': 'jpeg', '.png': 'png', '.webp': 'webp' };
const dryRun = process.argv.includes('--dry-run');

const run = async () => {
  const dir = uploadDir();
  let withMeta = 0;
  let rewritten = 0;
  for (const name of await fs.readdir(dir)) {
    const format = FORMAT[path.extname(name).toLowerCase()];
    if (!format) continue;
    const file = path.join(dir, name);
    const meta = await sharp(file).metadata().catch(() => null);
    if (!meta || !(meta.exif || meta.xmp || meta.iptc)) continue;
    withMeta += 1;
    if (dryRun) continue;
    const out = await sharp(file).rotate().toFormat(format, { quality: 85 }).toBuffer();
    await fs.writeFile(file, out);
    rewritten += 1;
  }
  console.log(`${withMeta} file(s) carried metadata; ${dryRun ? 'dry run, none changed' : `${rewritten} rewritten`}.`);
};

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
