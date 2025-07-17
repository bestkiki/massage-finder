import React, { useState, useEffect, useCallback } from 'react';
import { MassageShop } from '../types';

interface YouTubeVideoBannerProps {
  shops: MassageShop[];
  onViewDetails: (shop: MassageShop) => void;
}

const getYoutubeVideoId = (url: string): string | null => {
  if (!url) return null;
  let videoId = null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);

  if (match && match[2].length === 11) {
    videoId = match[2];
  } else {
    const shortsMatch = url.match(/\/shorts\/([^#&?]+)/);
    if (shortsMatch && shortsMatch[1]) {
      videoId = shortsMatch[1];
    }
  }
  return videoId;
};

const MAX_DISPLAY_SHOPS = 5;

const YouTubeVideoBanner: React.FC<YouTubeVideoBannerProps> = ({ shops, onViewDetails }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const displayShops = shops
    .map(shop => ({ ...shop, videoId: getYoutubeVideoId(shop.youtubeUrl || '') }))
    .filter(shop => !!shop.videoId)
    .slice(0, MAX_DISPLAY_SHOPS);

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
    if (displayShops.length <= 1) return;

    const slideInterval = setInterval(nextSlide, 7000); // Auto-slide every 7 seconds
    return () => clearInterval(slideInterval);
  }, [nextSlide, displayShops.length]);

  if (!displayShops || displayShops.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="video-banner-title" className="mb-10 md:mb-16">
      <h3 id="video-banner-title" className="text-2xl sm:text-3xl font-bold text-pink-700 mb-6 text-center">
        <i className="fab fa-youtube text-red-500 mr-2"></i> 샵 영상 둘러보기
      </h3>
      <div className="relative w-full max-w-4xl mx-auto overflow-hidden rounded-xl shadow-xl border border-pink-100 bg-black">
        <div
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {displayShops.map((shop) => (
            <div key={shop.id} className="w-full flex-shrink-0" role="group" aria-roledescription="slide">
              <div className="aspect-video relative">
                <iframe
                  src={`https://www.youtube.com/embed/${shop.videoId}?autoplay=0&controls=0&modestbranding=1&rel=0&iv_load_policy=3&loop=1&playlist=${shop.videoId}`}
                  title={shop.name}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
                <div className="absolute bottom-0 left-0 p-4 md:p-8 w-full bg-gradient-to-t from-black/80 via-black/50 to-transparent pointer-events-none">
                  <div className="pointer-events-auto">
                    <h4 className="text-xl md:text-3xl font-bold mb-1 md:mb-2 text-white shadow-lg">{shop.name}</h4>
                    <button
                      onClick={() => onViewDetails(shop)}
                      className="bg-white hover:bg-gray-200 text-black font-semibold py-2 px-4 rounded-md text-sm transition-colors duration-150 shadow-md hover:shadow-lg"
                    >
                      샵 정보 보기 <i className="fas fa-arrow-right ml-1.5 text-xs"></i>
                    </button>
                  </div>
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
              aria-label="이전 영상 보기"
            >
              <i className="fas fa-chevron-left w-5 h-5"></i>
            </button>
            <button
              onClick={nextSlide}
              className="absolute top-1/2 right-2 md:right-4 transform -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition-colors z-10"
              aria-label="다음 영상 보기"
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
                  aria-label={`샵 영상 ${index + 1} 보기`}
                ></button>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default YouTubeVideoBanner;