// Derives an urgency rating from questionnaire Yes/No answers.
// `label` matches the backend's Complaint.urgencyLevel enum exactly.
export const calculateUrgency = (answers) => {
  const yesCount = Object.values(answers).filter((val) => val === 'Yes').length;

  if (yesCount >= 3) {
    return { level: 'High Urgency', label: 'High Urgency', color: 'var(--status-rejected)' };
  }
  if (yesCount >= 1) {
    return { level: 'Medium Urgency', label: 'Medium Urgency', color: 'var(--status-pending)' };
  }
  return { level: 'Standard Urgency', label: 'Standard Urgency', color: 'var(--accent)' };
};
