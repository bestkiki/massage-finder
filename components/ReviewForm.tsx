
import React, { useState, FormEvent } from 'react';
import StarIcon from './icons/StarIcon';
import { addReviewToShop } from '../firebase'; // Assuming addReviewToShop is in firebase.ts

interface ReviewFormProps {
  shopId: string;
  onReviewSubmitted: (updatedShopData: { newAverageRating: number; newReviewCount: number }) => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ shopId, onReviewSubmitted }) => {
  const [authorName, setAuthorName] = useState<string>('');
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!authorName.trim()) {
      setError('작성자 이름을 입력해주세요.');
      return;
    }
    if (rating === 0) {
      setError('별점을 선택해주세요.');
      return;
    }
    if (!comment.trim()) {
      setError('리뷰 내용을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const reviewData = { authorName, rating, comment };
      const { newAverageRating, newReviewCount } = await addReviewToShop(shopId, reviewData);
      setSuccessMessage('리뷰가 성공적으로 등록되었습니다!');
      setAuthorName('');
      setRating(0);
      setComment('');
      if (onReviewSubmitted) {
        onReviewSubmitted({ newAverageRating, newReviewCount });
      }
    } catch (submissionError: any) {
      setError(`리뷰 등록 실패: ${submissionError.message}`);
      console.error("Review submission error:", submissionError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const commonInputClass = "mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm";
  const commonLabelClass = "block text-sm font-medium text-slate-700";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4 mt-4 border-t border-pink-200">
      <h4 className="text-md font-semibold text-gray-700">리뷰 작성하기</h4>
      {error && <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm" role="alert">{error}</div>}
      {successMessage && <div className="p-3 bg-green-100 border border-green-300 text-green-700 rounded-md text-sm" role="alert">{successMessage}</div>}

      <div>
        <label htmlFor="authorName" className={commonLabelClass}>작성자 이름 <span className="text-red-500">*</span></label>
        <input
          type="text"
          name="authorName"
          id="authorName"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          className={commonInputClass}
          required
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label className={commonLabelClass}>별점 <span className="text-red-500">*</span></label>
        <div className="flex items-center mt-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              type="button"
              key={star}
              onClick={() => !isSubmitting && setRating(star)}
              onMouseEnter={() => !isSubmitting && setHoverRating(star)}
              onMouseLeave={() => !isSubmitting && setHoverRating(0)}
              className={`text-2xl cursor-pointer transition-colors ${
                (hoverRating || rating) >= star ? 'text-pink-500' : 'text-gray-300'
              } disabled:opacity-50`}
              aria-label={`별점 ${star}점`}
              disabled={isSubmitting}
            >
              <StarIcon filled={(hoverRating || rating) >= star} className="w-6 h-6" />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="comment" className={commonLabelClass}>리뷰 내용 <span className="text-red-500">*</span></label>
        <textarea
          name="comment"
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className={commonInputClass}
          required
          disabled={isSubmitting}
          placeholder="이 샵에 대한 경험을 공유해주세요."
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-500 hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-400 disabled:bg-slate-300"
      >
        {isSubmitting ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            등록 중...
          </>
        ) : (
          <><i className="fas fa-paper-plane mr-2"></i>리뷰 등록</>
        )}
      </button>
    </form>
  );
};

export default ReviewForm;
