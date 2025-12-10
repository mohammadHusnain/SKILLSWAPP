/**
 * Convert match percentage (0-100%) to star rating (0-5 stars)
 * @param {number} matchPercentage - Match compatibility percentage (0-100)
 * @returns {number} Star rating (0-5)
 */
export const convertMatchToStars = (matchPercentage) => {
  if (!matchPercentage || matchPercentage < 0) return 0;
  if (matchPercentage >= 86) return 5;
  if (matchPercentage >= 71) return 4;
  if (matchPercentage >= 51) return 3;
  if (matchPercentage >= 31) return 2;
  if (matchPercentage >= 11) return 1;
  return 0.5;
};

/**
 * Get star rating display value (for showing half stars)
 * @param {number} matchPercentage - Match compatibility percentage (0-100)
 * @returns {number} Star rating with decimal (0-5)
 */
export const getStarRating = (matchPercentage) => {
  if (!matchPercentage || matchPercentage < 0) return 0;
  // More granular conversion for display
  if (matchPercentage >= 90) return 5;
  if (matchPercentage >= 80) return 4.5;
  if (matchPercentage >= 70) return 4;
  if (matchPercentage >= 60) return 3.5;
  if (matchPercentage >= 50) return 3;
  if (matchPercentage >= 40) return 2.5;
  if (matchPercentage >= 30) return 2;
  if (matchPercentage >= 20) return 1.5;
  if (matchPercentage >= 10) return 1;
  return 0.5;
};

