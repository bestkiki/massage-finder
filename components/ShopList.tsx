
import React from 'react';
import { MassageShop } from '../types';
import ShopCard from './ShopCard';

interface ShopListProps {
  shops: MassageShop[];
  onViewDetails: (shop: MassageShop) => void; 
}

const ShopList: React.FC<ShopListProps> = ({ shops, onViewDetails }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {shops.map(shop => (
        <ShopCard key={shop.id} shop={shop} onViewDetails={onViewDetails} />
      ))}
    </div>
  );
};

export default ShopList;
