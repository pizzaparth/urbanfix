// Derives an urgency rating from questionnaire Yes/No answers.
// `label` matches the backend's Complaint.urgencyLevel enum exactly.
export const calculateUrgency = (answers) => {
  const yesCount = Object.values(answers).filter((val) => val === 'Yes').length;

  if (yesCount >= 3) {
    return { level: 'High Urgency', label: 'High Urgency', color: '#EF4444', bg: '#FEE2E2' };
  }
  if (yesCount >= 1) {
    return { level: 'Medium Urgency', label: 'Medium Urgency', color: '#B45309', bg: '#FEF3C7' };
  }
  return { level: 'Standard Urgency', label: 'Standard Urgency', color: '#2563EB', bg: '#DBEAFE' };
};
