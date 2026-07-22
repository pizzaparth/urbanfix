export const CATEGORIES = ['Road Damage', 'Water Leakage', 'Garbage', 'Street Light', 'Administrative', 'Other'];

// Category-Specific Dynamic Questionnaires as specified in project_description.pdf
export const CATEGORY_QUESTIONNAIRES = {
  'Road Damage': [
    { id: 'q_accident', question: 'Has there been any accident because of this issue?' },
    { id: 'q_duration', question: 'Has the problem existed for more than one week?' },
    { id: 'q_public_facility', question: 'Is a school or hospital located nearby?' },
    { id: 'q_busy_area', question: 'Is there a market or busy public area nearby?' },
    { id: 'q_vehicle_flow', question: 'Is the issue affecting vehicle movement or blocking traffic?' },
    { id: 'q_inconvenience', question: 'Is the issue causing severe public inconvenience?' },
  ],
  'Water Leakage': [
    { id: 'q_flooding', question: 'Is there severe water wastage or street flooding?' },
    { id: 'q_drinking_water', question: 'Has the leakage affected clean drinking water supply?' },
    { id: 'q_duration', question: 'Has the problem existed for more than 3 days?' },
    { id: 'q_public_facility', question: 'Is a school or hospital located nearby?' },
    { id: 'q_property_damage', question: 'Is the water leakage causing structural or property damage?' },
    { id: 'q_inconvenience', question: 'Is the issue causing severe public inconvenience?' },
  ],
  Garbage: [
    { id: 'q_overflowing', question: 'Is garbage overflowing onto the main road or public path?' },
    { id: 'q_odor_pest', question: 'Is there a severe foul odor or health hazard/pest risk?' },
    { id: 'q_uncollected', question: 'Has garbage been uncollected for more than 48 hours?' },
    { id: 'q_public_facility', question: 'Is a school, hospital, or food market located nearby?' },
    { id: 'q_inconvenience', question: 'Is the issue causing severe public inconvenience?' },
  ],
  'Street Light': [
    { id: 'q_darkness', question: 'Is the entire street or junction completely dark at night?' },
    { id: 'q_duration', question: 'Has the light malfunctioned for more than one week?' },
    { id: 'q_safety_risk', question: 'Does the dark area pose an immediate safety/crime concern?' },
    { id: 'q_busy_area', question: 'Is a market, bus stop, or public area nearby?' },
    { id: 'q_inconvenience', question: 'Is the issue causing public inconvenience?' },
  ],
  Administrative: [
    { id: 'q_delayed', question: 'Has an official service request been delayed beyond standard limits?' },
    { id: 'q_violation', question: 'Were official administrative procedures violated or unheeded?' },
    { id: 'q_multiple_citizens', question: 'Does this administrative issue affect multiple citizens?' },
    { id: 'q_previous_notice', question: 'Have you previously submitted a physical or verbal request?' },
    { id: 'q_inconvenience', question: 'Is the issue causing public inconvenience?' },
  ],
  Other: [
    { id: 'q_safety_risk', question: 'Is this issue causing immediate public inconvenience or safety risk?' },
    { id: 'q_duration', question: 'Has this issue persisted for more than a week?' },
    { id: 'q_public_facility', question: 'Is a school, hospital, or busy public area nearby?' },
  ],
};
