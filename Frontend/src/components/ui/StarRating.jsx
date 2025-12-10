'use client';

import { Star } from 'lucide-react';
import { getStarRating } from '@/utils/starRating';

/**
 * StarRating Component
 * Displays star rating based on match percentage or direct rating value
 * @param {number} rating - Rating value (0-5) or match percentage (0-100)
 * @param {boolean} isPercentage - If true, treats rating as percentage and converts to stars
 * @param {string} size - Size class for stars (default: 'w-4 h-4')
 * @param {boolean} showNumber - Show numeric rating alongside stars (default: true)
 * @param {string} className - Additional CSS classes
 */
const StarRating = ({ 
  rating, 
  isPercentage = false, 
  size = 'w-4 h-4', 
  showNumber = true,
  className = '' 
}) => {
  // Convert percentage to stars if needed
  const starValue = isPercentage ? getStarRating(rating) : (rating || 0);
  const fullStars = Math.floor(starValue);
  const hasHalfStar = starValue % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {/* Full stars */}
      {[...Array(fullStars)].map((_, i) => (
        <Star
          key={`full-${i}`}
          className={`${size} fill-yellow-400 text-yellow-400`}
        />
      ))}
      
      {/* Half star */}
      {hasHalfStar && (
        <div className="relative inline-block" style={{ width: '1rem', height: '1rem' }}>
          <Star className={`${size} text-gray-500`} />
          <div className="absolute left-0 top-0 overflow-hidden" style={{ width: '50%', height: '100%' }}>
            <Star className={`${size} fill-yellow-400 text-yellow-400`} />
          </div>
        </div>
      )}
      
      {/* Empty stars */}
      {[...Array(emptyStars)].map((_, i) => (
        <Star
          key={`empty-${i}`}
          className={`${size} text-gray-500`}
        />
      ))}
      
      {showNumber && (
        <span className="text-sm text-text-muted ml-2">
          {isPercentage ? `${Math.round(rating)}%` : starValue.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default StarRating;

