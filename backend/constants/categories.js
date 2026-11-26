// The complaint categories the app accepts. Each one is backed by a public,
// annotated image dataset that meets Eq. (1) of the paper and trains its
// detection model (see ai_model/DATASETS.md). 'Open Manhole' was withdrawn in
// November 2026: no real-photo dataset with documented provenance exists.
// Complaints filed under it earlier keep their category. Mirrored in
// mobile/src/constants/categories.js — keep the two in sync by hand, the app
// bundle can't import from here.
export const CATEGORIES = [
  'Pothole / Road Damage',
  'Garbage / Litter',
  'Graffiti',
];
