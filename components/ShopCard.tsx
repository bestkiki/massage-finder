
import React from 'react';
import { MassageShop } from '../types';
import StarIcon from './icons/StarIcon';
import LocationPinIcon from './icons/LocationPinIcon';
// PhoneIcon is not needed here anymore as details are on a separate page
// ShopReviews is not needed here anymore

interface ShopCardProps {
  shop: MassageShop;
  onViewDetails: (shop: MassageShop) => void; // Callback to App.tsx to show detail page
}

const ShopCard: React.FC<ShopCardProps> = ({ shop, onViewDetails }) => {
  return (
    <div className="bg-white rounded-xl shadow-xl hover:shadow-2xl overflow-hidden transition-all duration-300 border border-gray-200 flex flex-col">
      <div className="relative">
        <img 
          className="w-full h-60 object-cover" 
          src={shop.imageUrl || 'https://picsum.photos/seed/shop/600/400'} 
          alt={shop.name} 
        />
        <div className="absolute top-4 right-4 bg-pink-500 text-white px-3 py-1.5 rounded-lg text-sm font-semibold shadow-md flex items-center">
          <StarIcon filled={true} className="w-4 h-4 inline-block mr-1.5" />
          {shop.rating.toFixed(1)} 
          <span className="ml-1.5 text-xs opacity-80">({shop.reviewCount || 0} 리뷰)</span>
        </div>
      </div>
      
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">{shop.name}</h3>
        
        <p className="text-gray-500 text-sm mb-4 flex items-start">
          <LocationPinIcon className="w-4 h-4 mr-1.5 mt-0.5 text-gray-400 flex-shrink-0" />
          {shop.address}
        </p>
        
        <p className="text-gray-600 text-base leading-relaxed mb-5 flex-grow line-clamp-3"> 
          {shop.description}
        </p>
        
        {shop.servicesPreview && shop.servicesPreview.length > 0 && (
          <div className="mb-5">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">주요 서비스</h4>
            <div className="flex flex-wrap gap-2">
              {shop.servicesPreview.slice(0, 3).map(service => (
                <span key={service} className="bg-pink-50 text-pink-700 px-3 py-1 rounded-full text-xs font-semibold border border-pink-200 shadow-sm">
                  {service}
                </span>
              ))}
              {shop.servicesPreview.length > 3 && (
                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-semibold border border-gray-200 shadow-sm">
                  + {shop.servicesPreview.length - 3} 더보기
                </span>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="p-5 bg-gray-50 border-t border-gray-200">
        <button
          onClick={() => onViewDetails(shop)}
          className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 text-sm flex items-center justify-center shadow-md hover:shadow-lg"
        >
          <i className="fas fa-eye mr-2.5"></i>
          자세히 보기
        </button>
      </div>
    </div>
  );
};

export default ShopCard;
