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
  'Water Leakage': [
    { id: 'q_drinking_water', question: 'Has the leakage affected clean drinking water supply?', weight: 2 },
    { id: 'q_property_damage', question: 'Is the leakage causing structural or property damage?', weight: 2 },
    { id: 'q_flooding', question: 'Is there severe water wastage or street flooding?', weight: 1 },
    { id: 'q_duration', question: 'Has the problem existed for more than 3 days?', weight: 1 },
    { id: 'q_public_facility', question: 'Is a school or hospital located nearby?', weight: 1 },
  ],
  'Faulty Streetlight': [
    { id: 'q_safety_risk', question: 'Does the darkness pose an immediate safety or crime risk?', weight: 2 },
    { id: 'q_darkness', question: 'Is the entire street or junction completely dark at night?', weight: 1 },
    { id: 'q_duration', question: 'Has the light been non-functional for more than one week?', weight: 1 },
    { id: 'q_busy_area', question: 'Is a market, bus stop, or school located nearby?', weight: 1 },
    { id: 'q_multiple_lights', question: 'Are multiple streetlights affected in this stretch?', weight: 1 },
  ],
  'Illegal Parking': [
    { id: 'q_blocking_traffic', question: 'Is the vehicle blocking traffic or emergency vehicle access?', weight: 2 },
    { id: 'q_blocking_path', question: 'Is it blocking a pedestrian path, ramp, or driveway?', weight: 1 },
    { id: 'q_duration', question: 'Has the vehicle been parked illegally for more than 24 hours?', weight: 1 },
    { id: 'q_repeat_offender', question: 'Is this a recurring/frequent parking violation at this spot?', weight: 1 },
    { id: 'q_busy_area', question: 'Is this near a school, hospital, or busy commercial area?', weight: 1 },
  ],
  'Open Manhole': [
    { id: 'q_uncovered', question: 'Is the manhole completely uncovered, posing a fall hazard?', weight: 2 },
    { id: 'q_busy_area', question: 'Is it located on a busy road, pathway, or residential area with children?', weight: 2 },
    { id: 'q_duration', question: 'Has it been open for more than 2 days?', weight: 1 },
    { id: 'q_lighting', question: 'Is the area poorly lit, making the manhole hard to notice at night?', weight: 1 },
    { id: 'q_near_facility', question: 'Is a school or playground located nearby?', weight: 1 },
  ],
  'Fallen Tree': [
    { id: 'q_blocking_road', question: 'Is it blocking a road or pathway?', weight: 2 },
    { id: 'q_power_lines', question: 'Has it damaged property, vehicles, or power lines?', weight: 2 },
    { id: 'q_safety_hazard', question: 'Is it posing an immediate safety hazard to pedestrians or vehicles?', weight: 1 },
    { id: 'q_duration', question: 'Has it been lying there for more than 24 hours?', weight: 1 },
    { id: 'q_busy_area', question: 'Is this in a busy or residential area?', weight: 1 },
  ],
  'Damaged Road Signs': [
    { id: 'q_safety_sign', question: 'Is the missing/damaged sign a critical safety sign (stop, yield, speed limit)?', weight: 2 },
    { id: 'q_near_accident', question: 'Has its absence caused confusion or a near-accident?', weight: 2 },
    { id: 'q_visibility', question: 'Is the sign completely unreadable or missing (not just faded)?', weight: 1 },
    { id: 'q_duration', question: 'Has the sign been damaged or missing for more than a week?', weight: 1 },
    { id: 'q_busy_area', question: 'Is this on a busy road or intersection?', weight: 1 },
  ],
  Graffiti: [
    { id: 'q_offensive', question: 'Does the graffiti contain offensive, hateful, or inappropriate content?', weight: 2 },
    { id: 'q_public_building', question: 'Is it on a government building, monument, or public property?', weight: 1 },
    { id: 'q_duration', question: 'Has it been there for more than two weeks?', weight: 1 },
    { id: 'q_high_visibility', question: 'Is it in a high-visibility public area?', weight: 1 },
    { id: 'q_repeat', question: 'Is this a recurring vandalism spot?', weight: 1 },
  ],
  'Damaged Electrical Poles / Wires': [
    { id: 'q_exposed_wires', question: 'Are live wires exposed or hanging at a low, reachable height?', weight: 2 },
    { id: 'q_leaning_pole', question: 'Is the pole visibly leaning, cracked, or at risk of collapse?', weight: 2 },
    { id: 'q_recent_incident', question: 'Has this already caused a shock, spark, or fire incident?', weight: 2 },
    { id: 'q_busy_area', question: 'Is this near a school, market, or busy pedestrian area?', weight: 1 },
    { id: 'q_duration', question: 'Has this condition existed for more than a day?', weight: 1 },
  ],
};
