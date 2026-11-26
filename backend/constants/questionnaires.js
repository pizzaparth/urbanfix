// Category questionnaires and their weights (2 = safety-critical, 1 = standard).
// The server scores urgency from these (utils/urgency.js, Eq. 2 in the paper);
// the app shows the same questions and a live preview of the score.
// Mirrored in mobile/src/constants/categories.js — keep the two in sync by hand,
// the app bundle can't import from here. tests/urgency.test.js checks the copy.
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
  // Withdrawn category: no longer offered for filing, kept so that the published
  // answers of complaints filed before November 2026 can still be recomputed.
  'Open Manhole': [
    { id: 'q_uncovered', question: 'Is the manhole completely uncovered, posing a fall hazard?', weight: 2 },
    { id: 'q_busy_area', question: 'Is it located on a busy road, pathway, or residential area with children?', weight: 2 },
    { id: 'q_duration', question: 'Has it been open for more than 2 days?', weight: 1 },
    { id: 'q_lighting', question: 'Is the area poorly lit, making the manhole hard to notice at night?', weight: 1 },
    { id: 'q_near_facility', question: 'Is a school or playground located nearby?', weight: 1 },
  ],
  Graffiti: [
    { id: 'q_offensive', question: 'Does the graffiti contain offensive, hateful, or inappropriate content?', weight: 2 },
    { id: 'q_public_building', question: 'Is it on a government building, monument, or public property?', weight: 1 },
    { id: 'q_duration', question: 'Has it been there for more than two weeks?', weight: 1 },
    { id: 'q_high_visibility', question: 'Is it in a high-visibility public area?', weight: 1 },
    { id: 'q_repeat', question: 'Is this a recurring vandalism spot?', weight: 1 },
  ],
};
