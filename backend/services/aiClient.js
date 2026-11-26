import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import Complaint from '../models/Complaint.js';
import { uploadDir } from '../config/paths.js';

// Calls the FastAPI vision service (ai_service/) for a complaint's photos and stores
// the result as `aiAnalysis`. Runs after the filing response has been sent, so a
// slow or failed model call never delays or blocks filing. Any failure leaves the
// complaint flagged for review (needsReview = true), never rejected.

export const CATEGORY_MODEL = {
  'Pothole / Road Damage': 'pothole_road_damage',
  'Garbage / Litter': 'garbage_litter',
  Graffiti: 'graffiti',
};

const MAX_RETRIES = 2;
const MAX_STORED_DETECTIONS = 30;
const timeoutMs = () => Number(process.env.AI_TIMEOUT_MS) || 20000;
const retryDelayMs = () => Number(process.env.AI_RETRY_DELAY_MS ?? 1000);

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const setAnalysis = (id, aiAnalysis) => Complaint.updateOne({ _id: id }, { $set: { aiAnalysis } });

const callService = async (baseUrl, model, files) => {
  const form = new FormData();
  for (const f of files) form.append('files', new Blob([f.data], { type: f.type }), f.name);
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/predict/${model}`, {
    method: 'POST',
    body: form,
    signal: AbortSignal.timeout(timeoutMs()),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(`AI service answered ${res.status}: ${text.slice(0, 200)}`);
    err.retryable = res.status >= 500;
    throw err;
  }
  return res.json();
};

const saveAnnotated = async (complaintId, images) => {
  const saved = [];
  for (const img of images || []) {
    if (!img.annotated_jpeg_base64) continue;
    const name = `ai-${complaintId}-${img.index}-${crypto.randomBytes(4).toString('hex')}.jpg`;
    await fs.writeFile(path.join(uploadDir(), name), Buffer.from(img.annotated_jpeg_base64, 'base64'));
    saved.push(`/uploads/${name}`);
  }
  return saved;
};

const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

export const analyseComplaint = async (complaintId) => {
  const complaint = await Complaint.findById(complaintId).select('category images').lean();
  if (!complaint) return null;

  const model = CATEGORY_MODEL[complaint.category];
  const baseUrl = process.env.AI_SERVICE_URL;

  if (!complaint.images?.length) {
    return setAnalysis(complaintId, {
      state: 'skipped', needsReview: true, error: 'No photos to analyse.', analysedAt: new Date(),
    });
  }
  if (!baseUrl || !model) {
    return setAnalysis(complaintId, {
      state: 'failed', needsReview: true,
      error: !baseUrl ? 'AI service is not configured (AI_SERVICE_URL).' : 'No model for this category.',
      analysedAt: new Date(),
    });
  }

  const files = await Promise.all(
    complaint.images.map(async (url) => {
      const name = path.basename(url);
      return { name, type: MIME[path.extname(name).toLowerCase()] || 'image/jpeg', data: await fs.readFile(path.join(uploadDir(), name)) };
    })
  );

  let lastError;
  let attemptsMade = 0;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    attemptsMade = attempt + 1;
    try {
      const out = await callService(baseUrl, model, files);
      const detections = (out.images || [])
        .flatMap((img) =>
          (img.detections || []).map((d) => ({
            image: img.index,
            box: d.box,
            confidence: d.confidence,
            className: d.class_name,
          }))
        )
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, MAX_STORED_DETECTIONS);

      return setAnalysis(complaintId, {
        state: 'done',
        modelVersion: out.model_version,
        tau: out.tau,
        sStar: out.s_star,
        delta: out.delta ?? null,
        needsReview: Boolean(out.needs_review),
        detections,
        annotatedImages: await saveAnnotated(complaintId, out.images),
        inferenceMs: out.inference_ms,
        attempts: attempt + 1,
        analysedAt: new Date(),
      });
    } catch (err) {
      lastError = err;
      if (err.retryable === false || attempt === MAX_RETRIES) break;
      await pause(retryDelayMs() * (attempt + 1));
    }
  }

  return setAnalysis(complaintId, {
    state: 'failed',
    needsReview: true,
    error: String(lastError?.message || lastError).slice(0, 300),
    attempts: attemptsMade,
    analysedAt: new Date(),
  });
};

// Fire-and-forget after the filing response. Tests await the returned promise.
export const scheduleAnalysis = (complaintId) =>
  new Promise((resolve) => {
    setImmediate(() => {
      analyseComplaint(complaintId)
        .catch((err) => console.error('AI analysis failed:', err.message))
        .finally(resolve);
    });
  });
