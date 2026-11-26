// Only categories backed by a public, annotated image dataset (used to train
// each category's detection model) are offered. Mirrored in
// backend/constants/categories.js, which the API validates against.
export const CATEGORIES = [
  'Pothole / Road Damage',
  'Garbage / Litter',
  'Graffiti',
];

// Category-Specific Dynamic Questionnaires.
// Each question carries a `weight` (2 = safety-critical, 1 = standard context) — see
// `utils/urgency.js` for how these feed into the priority/urgency calculation.
export const CATEGORY_QUESTIONNAIRES = {
  'Pothole / Road Damage': [
    { id: 'q_accident', question: 'Has this pothole/damage caused an accident or vehicle damage?', weight: 2 },
    { id: 'q_size', question: 'Is the pothole/damage large or deep enough to be a serious hazard?', weight: 2 },
    { id: 'q_traffic', question: 'Is it affecting vehicle movement or blocking traffic?', weight: 1 },
    { id: 'q_duration', question: 'Has the problem existed for more than one week?', weight: 1 },
    { id: 'q_public_facility', question: 'Is a school, hospital, or busy market nearby?', weight: 1 },
  ],
  'Garbage / Litter': [
    { id: 'q_health_hazard', question: 'Is there a foul odor, pest infestation, or health hazard?', weight: 2 },
    { id: 'q_overflowing', question: 'Is garbage overflowing onto the road or public path?', weight: 1 },
    { id: 'q_uncollected', question: 'Has garbage been uncollected for more than 48 hours?', weight: 1 },
    { id: 'q_public_facility', question: 'Is a school, hospital, or food market located nearby?', weight: 1 },
    { id: 'q_inconvenience', question: 'Is the issue causing severe public inconvenience?', weight: 1 },
  ],
  Graffiti: [
    { id: 'q_offensive', question: 'Does the graffiti contain offensive, hateful, or inappropriate content?', weight: 2 },
    { id: 'q_public_building', question: 'Is it on a government building, monument, or public property?', weight: 1 },
    { id: 'q_duration', question: 'Has it been there for more than two weeks?', weight: 1 },
    { id: 'q_high_visibility', question: 'Is it in a high-visibility public area?', weight: 1 },
    { id: 'q_repeat', question: 'Is this a recurring vandalism spot?', weight: 1 },
  ],
};
