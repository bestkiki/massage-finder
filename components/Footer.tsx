
import React from 'react';

interface FooterProps {
  children?: React.ReactNode; 
}

const Footer: React.FC<FooterProps> = ({ children }) => {
  return (
    <footer className="bg-white text-gray-600 py-10 border-t border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-3">
           <i className="fas fa-spa text-3xl text-pink-500"></i>
        </div>
        <p className="text-sm">&copy; {new Date().getFullYear()} 마사지 파인더. 모든 권리 보유.</p>
        <p className="text-xs text-gray-400 mt-1">
          본 사이트는 포트폴리오 목적으로 제작되었으며, 실제 운영되는 서비스가 아닙니다.
        </p>
        {children && <div className="mt-4 text-sm">{children}</div>}
      </div>
    </footer>
  );
};

export default Footer;