
import React from 'react';
import { Review } from '../types';
import StarIcon from './icons/StarIcon';
import firebase from 'firebase/compat/app'; // Added import
import 'firebase/compat/firestore'; // Ensure firestore types are available for Timestamp

interface ReviewListItemProps {
  review: Review;
}

const ReviewListItem: React.FC<ReviewListItemProps> = ({ review }) => {
  const formatDate = (timestamp: firebase.firestore.Timestamp | null | undefined): string => {
    if (!timestamp) return '날짜 정보 없음';
    return timestamp.toDate().toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="py-4 border-b border-pink-100 last:border-b-0">
      <div className="flex items-center mb-1.5">
        <strong className="text-sm font-semibold text-gray-800 mr-2">{review.authorName}</strong>
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <StarIcon
              key={star}
              filled={star <= review.rating}
              className="w-4 h-4 text-pink-500"
            />
          ))}
        </div>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed mb-1.5">{review.comment}</p>
      <p className="text-xs text-gray-400">{formatDate(review.createdAt)}</p>
    </div>
  );
};

export default ReviewListItem;