
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white text-gray-700 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <i className="fas fa-spa mr-2 text-4xl text-pink-500"></i>
          <h1 className="text-3xl font-bold tracking-tight text-gray-800">
            마사지 파인더
          </h1>
        </div>
        <nav className="space-x-2">
          <a 
            href="#" 
            className="text-gray-600 hover:text-pink-500 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150"
          >
            홈
          </a>
          <a 
            href="#" 
            className="text-gray-600 hover:text-pink-500 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150"
          >
            인기 샵
          </a>
          <a 
            href="#" 
            className="bg-pink-500 text-white hover:bg-pink-600 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-150 shadow-md hover:shadow-lg"
          >
            문의하기
          </a>
        </nav>
      </div>
    </header>
  );
};

export default Header;