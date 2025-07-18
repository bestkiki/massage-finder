import React, { useState, useEffect, useCallback } from 'react';
import { Review } from '../types';
import { fetchReviewsForShop } from '../firebase';
import ReviewListItem from './ReviewListItem';
import ReviewForm from './ReviewForm';

interface ShopReviewsProps {
  shopId: string;
  reviewCount: number;
  onShopDataNeedsRefresh: () => void;
}

const ShopReviews: React.FC<ShopReviewsProps> = ({ shopId, reviewCount, onShopDataNeedsRefresh }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadReviews = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedReviews = await fetchReviewsForShop(shopId);
      setReviews(fetchedReviews);
    } catch (e: any) {
      console.error("Error loading reviews:", e);
      setError(e.message || '알 수 없는 오류로 리뷰를 불러오는 데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleReviewSubmitted = () => {
    // When a review is submitted, we need to refresh the reviews for this shop
    // AND we need to tell App.tsx to reload all shops because the average rating might have changed.
    loadReviews(); // Refresh local review list
    onShopDataNeedsRefresh(); // Trigger global shop list refresh
  };

  return (
    <div className="mt-5 pt-5 border-t border-pink-200">
      <h4 className="text-lg font-semibold text-gray-800 mb-3">
        <i className="fas fa-comments mr-2 text-pink-500"></i> 방문자 리뷰 ({reviewCount})
      </h4>
      {isLoading && (
        <div className="text-center py-4">
          <div role="status" className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-pink-400 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" aria-label="리뷰 로딩 중"></div>
          <p className="text-sm text-pink-600 mt-2">리뷰를 불러오는 중입니다...</p>
        </div>
      )}
      {!isLoading && error && (
        <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md text-center">
          <p>{error}</p>
          <button 
            onClick={loadReviews} 
            className="mt-2 text-xs text-white bg-pink-500 hover:bg-pink-600 font-semibold py-1 px-2 rounded-md transition-colors"
          >
            <i className="fas fa-sync-alt mr-1"></i> 다시 시도
          </button>
        </div>
      )}
      {!isLoading && !error && reviews.length === 0 && (
        <p className="text-gray-500 text-sm py-3 text-center bg-rose-50 rounded-md">
            아직 등록된 리뷰가 없습니다. 첫 리뷰를 작성해보세요!
        </p>
      )}
      {!isLoading && !error && reviews.length > 0 && (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2 rounded-md bg-rose-50 p-4 shadow-inner">
          {reviews.map((review) => (
            <ReviewListItem key={review.id} review={review} />
          ))}
        </div>
      )}
      <ReviewForm shopId={shopId} onReviewSubmitted={handleReviewSubmitted} />
    </div>
  );
};

export default ShopReviews;