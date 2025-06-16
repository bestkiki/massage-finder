
import React, { useState, useEffect, useCallback } from 'react';
import { MassageShop } from '../types';

interface RecommendedShopsBannerProps {
  shops: MassageShop[];
  onViewDetails: (shop: MassageShop) => void;
}

const MAX_DISPLAY_SHOPS = 8; // Max shops to use in banner rotation

const RecommendedShopsBanner: React.FC<RecommendedShopsBannerProps> = ({ shops, onViewDetails }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Use only up to MAX_DISPLAY_SHOPS
  const displayShops = shops.slice(0, MAX_DISPLAY_SHOPS);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % displayShops.length);
  }, [displayShops.length]);

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + displayShops.length) % displayShops.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  useEffect(() => {
    if (displayShops.length <= 1) return; // No auto-slide if 0 or 1 shop

    const slideInterval = setInterval(nextSlide, 5000); // Auto-slide every 5 seconds
    return () => clearInterval(slideInterval);
  }, [nextSlide, displayShops.length]);

  if (!displayShops || displayShops.length === 0) {
    return null; // Don't render anything if there are no recommended shops
  }

  return (
    <section aria-labelledby="recommended-shops-title" className="mb-10 md:mb-16">
      <h3 id="recommended-shops-title" className="text-2xl sm:text-3xl font-bold text-pink-700 mb-6 text-center">
        <i className="fas fa-star text-yellow-400 mr-2"></i> 추천 마사지 샵
      </h3>
      <div className="relative w-full max-w-4xl mx-auto overflow-hidden rounded-xl shadow-xl border border-pink-100 bg-white">
        <div
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {displayShops.map((shop) => (
            <div key={shop.id} className="w-full flex-shrink-0" role="group" aria-roledescription="slide">
              <div className="relative aspect-[16/9] md:aspect-[2/1]">
                <img
                  src={shop.imageUrl || 'https://picsum.photos/seed/banner/800/450'}
                  alt={shop.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-4 md:p-8 text-white">
                  <h4 className="text-xl md:text-3xl font-bold mb-1 md:mb-2">{shop.name}</h4>
                  <p className="text-xs md:text-sm text-pink-200 mb-2 md:mb-3 line-clamp-2">{shop.description}</p>
                  <button
                    onClick={() => onViewDetails(shop)}
                    className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-4 rounded-md text-sm transition-colors duration-150 shadow-md hover:shadow-lg"
                  >
                    자세히 보기 <i className="fas fa-arrow-right ml-1.5 text-xs"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {displayShops.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute top-1/2 left-2 md:left-4 transform -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition-colors z-10"
              aria-label="이전 추천 샵 보기"
            >
              <i className="fas fa-chevron-left w-5 h-5"></i>
            </button>
            <button
              onClick={nextSlide}
              className="absolute top-1/2 right-2 md:right-4 transform -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition-colors z-10"
              aria-label="다음 추천 샵 보기"
            >
              <i className="fas fa-chevron-right w-5 h-5"></i>
            </button>
            <div className="absolute bottom-3 md:bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
              {displayShops.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    currentIndex === index ? 'bg-pink-500' : 'bg-white/50 hover:bg-white/80'
                  }`}
                  aria-label={`추천 샵 ${index + 1} 보기`}
                ></button>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default RecommendedShopsBanner;
