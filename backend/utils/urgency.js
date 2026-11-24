import AppError from './appError.js';
import { CATEGORY_QUESTIONNAIRES } from '../constants/questionnaires.js';

// Eq. (2): U = sum(w_i * y_i) / sum(w_i), banded at 0.6 and 0.3.
// Computed on the server from the stored answers; any urgency the client sends is
// ignored, so a modified app cannot file a complaint with a made-up urgency.
export const HIGH_THRESHOLD = 0.6;
export const MEDIUM_THRESHOLD = 0.3;

export const bandForScore = (score) => {
  if (score >= HIGH_THRESHOLD) return 'High Urgency';
  if (score >= MEDIUM_THRESHOLD) return 'Medium Urgency';
  return 'Standard Urgency';
};

// `answers` maps every question id of the category to 'Yes' or 'No'. Throws a 400
// when a question is missing, unknown or has another value.
export const validateAnswers = (category, answers) => {
  const questions = CATEGORY_QUESTIONNAIRES[category];
  if (!questions) throw new AppError('Please choose a valid category', 400);
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
    throw new AppError('Please answer the questionnaire for this category.', 400);
  }

  const expected = new Set(questions.map((q) => q.id));
  const unknown = Object.keys(answers).filter((id) => !expected.has(id));
  if (unknown.length > 0) {
    throw new AppError(`Unknown questionnaire answer: ${unknown.join(', ')}.`, 400);
  }
  for (const q of questions) {
    if (answers[q.id] !== 'Yes' && answers[q.id] !== 'No') {
      throw new AppError(`Answer "${q.question}" with Yes or No.`, 400);
    }
  }
  return Object.fromEntries(questions.map((q) => [q.id, answers[q.id]]));
};

export const scoreAnswers = (category, answers) => {
  const questions = CATEGORY_QUESTIONNAIRES[category];
  const total = questions.reduce((sum, q) => sum + q.weight, 0);
  const scored = questions.reduce((sum, q) => sum + (answers[q.id] === 'Yes' ? q.weight : 0), 0);
  const score = total > 0 ? scored / total : 0;
  return { score: Math.round(score * 10000) / 10000, level: bandForScore(score) };
};

// The multipart form carries `answers` as a JSON string.
export const parseAnswersField = (raw) => {
  if (raw === undefined || raw === null || raw === '') return undefined;
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    throw new AppError('Questionnaire answers are not valid JSON.', 400);
  }
};
