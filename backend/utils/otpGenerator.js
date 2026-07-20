export const generateOtp = () => {
  // Generate a random 6-digit number as a string
  return Math.floor(100000 + Math.random() * 900000).toString();
};
