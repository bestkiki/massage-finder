import React, { useEffect, useState } from 'react';
import { MassageShop, Service } from '../types';
import ShopReviews from './ShopReviews';
import StarIcon from './icons/StarIcon';
import LocationPinIcon from './icons/LocationPinIcon';
import PhoneIcon from './icons/PhoneIcon';
import Header from './Header'; // Optional: for consistent header
import Footer from './Footer'; // Optional: for consistent footer
import { incrementShopViewCount } from '../firebase';


interface ShopDetailPageProps {
  shop: MassageShop;
  onClose: () => void;
  onShopDataNeedsRefresh: () => void;
}

const ShopDetailPage: React.FC<ShopDetailPageProps> = ({ shop, onClose, onShopDataNeedsRefresh }) => {
  const [currentShopData, setCurrentShopData] = useState<MassageShop>(shop);

  useEffect(() => {
    // Sync with prop changes if the user navigates between detail pages without closing
    setCurrentShopData(shop);
  }, [shop]);

  useEffect(() => {
    if (shop?.id) {
      // Update the count in the database
      incrementShopViewCount(shop.id);
      // Optimistically update the UI for immediate feedback
      setCurrentShopData(prevShop => ({
        ...prevShop,
        viewCount: (prevShop.viewCount || 0) + 1,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop?.id]); // This effect should run only once when the shop ID changes

  if (!currentShopData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-rose-50 p-4">
        <Header onNavigateHome={onClose} />
        <main className="flex-grow container mx-auto px-4 py-8 text-center">
          <i className="fas fa-exclamation-triangle text-5xl text-red-500 mb-4"></i>
          <h2 className="text-2xl font-semibold text-red-700 mb-2">샵 정보를 찾을 수 없습니다.</h2>
          <p className="text-gray-600 mb-6">선택한 샵의 정보를 불러오는 데 문제가 발생했습니다. 목록으로 돌아가 다시 시도해주세요.</p>
          <button
            onClick={onClose}
            className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-150 shadow-md hover:shadow-lg flex items-center mx-auto"
          >
            <i className="fas fa-arrow-left mr-2"></i> 목록으로 돌아가기
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
      <Header onNavigateHome={onClose} />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={onClose}
            className="mb-6 bg-pink-100 hover:bg-pink-200 text-pink-700 font-semibold py-2 px-4 rounded-lg transition-colors duration-150 text-sm flex items-center shadow hover:shadow-md"
            aria-label="목록으로 돌아가기"
          >
            <i className="fas fa-arrow-left mr-2"></i> 목록으로 돌아가기
          </button>

          <article className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200">
            <img
              className="w-full h-72 md:h-96 object-cover"
              src={currentShopData.imageUrl || 'https://picsum.photos/seed/shop-detail/800/600'}
              alt={currentShopData.name}
            />

            <div className="p-6 md:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-2 sm:mb-0 tracking-tight">
                  {currentShopData.name}
                </h1>
                <div className="flex items-center space-x-2">
                    <div className="flex items-center bg-black/40 text-white px-3 py-1.5 rounded-lg text-sm font-semibold backdrop-blur-sm shadow-md">
                        <i className="fas fa-eye w-4 h-4 inline-block mr-2"></i>
                        {currentShopData.viewCount ? currentShopData.viewCount.toLocaleString() : 0}
                    </div>
                    <div className="flex items-center bg-pink-500 text-white px-3 py-1.5 rounded-lg text-sm font-semibold shadow-md">
                        <StarIcon filled={true} className="w-4 h-4 inline-block mr-1.5" />
                        {currentShopData.rating.toFixed(1)}
                        <span className="ml-1.5 text-xs opacity-80">({currentShopData.reviewCount || 0})</span>
                    </div>
                </div>
              </div>

              <div className="mb-6 pb-6 border-b border-pink-100 space-y-3">
                <p className="text-gray-500 text-base flex items-start">
                  <LocationPinIcon className="w-5 h-5 mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
                  {currentShopData.address}
                </p>
                {currentShopData.phoneNumber && currentShopData.phoneNumber !== '정보 없음' && (
                  <p className="text-gray-600 text-base flex items-center">
                    <PhoneIcon className="w-5 h-5 mr-2 text-gray-400" />
                    <a href={`tel:${currentShopData.phoneNumber}`} className="hover:text-pink-600 transition-colors">{currentShopData.phoneNumber}</a>
                  </p>
                )}
                {currentShopData.operatingHours && currentShopData.operatingHours !== '정보 없음' && (
                  <p className="text-gray-600 text-base flex items-center">
                    <i className="far fa-clock w-5 h-5 mr-2 text-gray-400"></i>
                    <strong className="font-medium mr-1.5">운영시간:</strong> {currentShopData.operatingHours}
                  </p>
                )}
              </div>
              
              <div className="mb-6">
                 <h2 className="text-xl font-semibold text-gray-700 mb-3">샵 소개</h2>
                 <p className="text-gray-700 text-base leading-relaxed whitespace-pre-line">
                    {currentShopData.description}
                 </p>
              </div>

              {currentShopData.detailedServices && currentShopData.detailedServices.length > 0 && (
                <div className="mb-6 pb-6 border-b border-pink-100">
                  <h2 className="text-xl font-semibold text-gray-700 mb-4">서비스 및 가격 정보</h2>
                  <div className="space-y-3">
                    {currentShopData.detailedServices.map((service: Service) => (
                      <div key={service.name} className="flex justify-between items-center p-3 bg-rose-50 rounded-lg border border-pink-100 shadow-sm">
                        <span className="text-gray-700">{service.name}</span>
                        <span className="font-semibold text-pink-700">{service.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* ShopReviews component */}
              <ShopReviews shopId={currentShopData.id} reviewCount={currentShopData.reviewCount} onShopDataNeedsRefresh={onShopDataNeedsRefresh} />
            </div>
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ShopDetailPage;