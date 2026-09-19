export const CATEGORIES = [
  'Pothole / Road Damage',
  'Garbage / Litter',
  'Water Leakage',
  'Faulty Streetlight',
  'Illegal Parking',
  'Open Manhole',
  'Fallen Tree',
  'Damaged Road Signs',
  'Graffiti',
  'Damaged Electrical Poles / Wires',
];

export const QUESTIONS = [
  { id: 'q1', text: 'Does this pose an immediate safety risk?', weight: 2 },
  { id: 'q2', text: 'Has this been a problem for more than a week?', weight: 1 },
  { id: 'q3', text: 'Is it near a school, hospital, or busy public area?', weight: 2 },
];

export function scoreUrgency(answers) {
  let score = 0;
  QUESTIONS.forEach((q) => {
    if (answers[q.id] === 'Yes') score += q.weight;
  });
  if (score >= 4) return 'High';
  if (score >= 2) return 'Medium';
  return 'Standard';
}
