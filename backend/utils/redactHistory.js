// A complaint's first statusHistory entry is written by the filing citizen, so
// populating `changedBy` puts their real name in the timeline — on the public
// tracker that is anyone-with-a-tracking-id, and tracking ids are listed in the
// public registry. Staff don't need it either (triage needs the issue, not who
// filed it). Replace any citizen actor with a generic label; staff names stay,
// since accountability for who handled it is the point of the audit trail.
export const redactCitizenActors = (complaint) => {
  const out = complaint.toObject ? complaint.toObject() : { ...complaint };
  out.statusHistory = (out.statusHistory || []).map((h) =>
    h.changedBy && h.changedBy.role === 'citizen'
      ? { ...h, changedBy: { name: 'Citizen', role: 'citizen' } }
      : h
  );
  return out;
};
