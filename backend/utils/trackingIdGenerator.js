export const generateTrackingId = () => {
  // Construct a prefix using current date
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  // Append 5 random high-entropy alphanumeric characters
  const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `COMP-${datePart}-${randomPart}`;
};
