// Static sample data. No backend, no network calls.

export const MOCK_COMPLAINTS = [
  { id: 'c1', trackingId: 'UF-83920-A', title: 'Deep pothole on Elm St', category: 'Pothole / Road Damage', location: 'Ward 4, Elm St Bridge', status: 'Pending', date: '2026-09-10', description: 'Large pothole causing vehicles to swerve into oncoming traffic.', urgency: 'High', mine: true },
  { id: 'c2', trackingId: 'UF-77104-B', title: 'Streetlight out two weeks', category: 'Faulty Streetlight', location: 'Ward 7, Maple Ave', status: 'In Progress', date: '2026-09-05', description: 'Entire block dark at night, near the school.', urgency: 'Medium', mine: true },
  { id: 'c3', trackingId: 'UF-61255-C', title: 'Overflowing bin at market', category: 'Garbage / Litter', location: 'Ward 2, Central Market', status: 'Resolved', date: '2026-08-29', description: 'Trash overflowing onto the sidewalk for several days.', urgency: 'Standard', mine: false },
  { id: 'c4', trackingId: 'UF-49871-D', title: 'Open manhole on 5th', category: 'Open Manhole', location: 'Ward 1, 5th Avenue', status: 'Pending', date: '2026-09-14', description: 'Uncovered manhole right next to the bus stop.', urgency: 'High', mine: false },
  { id: 'c5', trackingId: 'UF-30284-E', title: 'Water leak flooding sidewalk', category: 'Water Leakage', location: 'Ward 6, Birch Lane', status: 'Rejected', date: '2026-08-20', description: 'Duplicate of an already-resolved ticket.', urgency: 'Standard', mine: false },
  { id: 'c6', trackingId: 'UF-15590-F', title: 'Fallen tree blocking lane', category: 'Fallen Tree', location: 'Ward 3, Oak Circle', status: 'In Progress', date: '2026-09-16', description: 'Storm knocked a tree across one lane of traffic.', urgency: 'Medium', mine: false },
  { id: 'c7', trackingId: 'UF-58802-G', title: 'Cracked lane near depot', category: 'Pothole / Road Damage', location: 'Ward 5, Depot Road', status: 'In Progress', date: '2026-09-12', description: 'Surface breaking apart along the bus route.', urgency: 'Medium', mine: false },
  { id: 'c8', trackingId: 'UF-22417-H', title: 'Sunken patch by crossing', category: 'Pothole / Road Damage', location: 'Ward 2, Pine Crossing', status: 'Pending', date: '2026-09-17', description: 'Road dips sharply right at the pedestrian crossing.', urgency: 'High', mine: false },
  { id: 'c9', trackingId: 'UF-90136-J', title: 'Bins uncollected on Cedar', category: 'Garbage / Litter', location: 'Ward 6, Cedar Street', status: 'Pending', date: '2026-09-15', description: 'Collection missed two weeks running.', urgency: 'Standard', mine: false },
  { id: 'c10', trackingId: 'UF-67520-K', title: 'Dumping behind the depot', category: 'Garbage / Litter', location: 'Ward 5, Depot Lane', status: 'Resolved', date: '2026-09-02', description: 'Construction waste left on public land.', urgency: 'Medium', mine: false },
  { id: 'c11', trackingId: 'UF-41863-L', title: 'Lights out along the park', category: 'Faulty Streetlight', location: 'Ward 3, Park Edge', status: 'Resolved', date: '2026-09-08', description: 'Four consecutive lamps dark after dusk.', urgency: 'Medium', mine: false },
  { id: 'c12', trackingId: 'UF-73094-M', title: 'Flicker on Willow Road', category: 'Faulty Streetlight', location: 'Ward 1, Willow Road', status: 'Pending', date: '2026-09-18', description: 'Lamp flickers all night and hums loudly.', urgency: 'Standard', mine: false },
];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function formatDate(iso) {
  const parts = iso.split('-').map(Number);
  return MONTHS[parts[1] - 1] + ' ' + parts[2];
}

export function makeTrackingId() {
  const n = Math.floor(10000 + Math.random() * 89999);
  const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  return 'UF-' + n + '-' + letter;
}

export function buildCategoryBars(list, limit = 4) {
  const counts = {};
  list.forEach((c) => { counts[c.category] = (counts[c.category] || 0) + 1; });
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, limit);
  const max = Math.max(...entries.map((e) => e[1]), 1);
  return entries.map(([label, count]) => {
    const short = label.includes('/') ? label.split('/')[0].trim() : label;
    return {
      label,
      shortLabel: short.length > 14 ? short.split(' ')[0] : short,
      count,
      ratio: count / max,
    };
  });
}
