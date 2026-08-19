// Derives an urgency rating from questionnaire Yes/No answers.
//
// Weighted by each question's severity (`weight` on the entries in
// `constants/categories.js`'s CATEGORY_QUESTIONNAIRES: 2 = safety-critical,
// 1 = standard context) and scored as a proportion of the category's total
// possible weight, rather than a flat "N or more Yes answers" cutoff. That
// keeps the score meaningful across categories whose questionnaires differ in
// length/severity mix, and lets a single safety-critical "Yes" (e.g. exposed
// live wires) move the needle more than a routine one (e.g. "more than a
// week old").
// `label` matches the backend's Complaint.urgencyLevel enum exactly.

const HIGH_THRESHOLD = 0.6;
const MEDIUM_THRESHOLD = 0.3;

const urgencyFromRatio = (ratio) => {
  if (ratio >= HIGH_THRESHOLD) {
    return { level: 'High Urgency', label: 'High Urgency', color: 'var(--status-rejected)' };
  }
  if (ratio >= MEDIUM_THRESHOLD) {
    return { level: 'Medium Urgency', label: 'Medium Urgency', color: 'var(--status-pending)' };
  }
  return { level: 'Standard Urgency', label: 'Standard Urgency', color: 'var(--accent)' };
};

// `questions` should be the CATEGORY_QUESTIONNAIRES[category] array the answers came
// from. If omitted (or empty), falls back to an unweighted proportion of "Yes"
// answers so older callers don't break.
export const calculateUrgency = (answers, questions = []) => {
  if (!questions.length) {
    const values = Object.values(answers);
    const ratio = values.length > 0 ? values.filter((val) => val === 'Yes').length / values.length : 0;
    return urgencyFromRatio(ratio);
  }

  const totalWeight = questions.reduce((sum, q) => sum + (q.weight || 1), 0);
  const scoredWeight = questions.reduce(
    (sum, q) => sum + (answers[q.id] === 'Yes' ? q.weight || 1 : 0),
    0
  );
  const ratio = totalWeight > 0 ? scoredWeight / totalWeight : 0;
  return urgencyFromRatio(ratio);
};
