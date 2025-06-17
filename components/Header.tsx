
import React, { useState, useEffect, useRef } from 'react';

const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);


  const navLinkClasses = "text-gray-600 hover:text-pink-500 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150";
  const mobileNavLinkClasses = "block w-full text-left px-4 py-3 text-base text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-colors duration-150";
  const contactButtonClasses = "bg-pink-500 text-white hover:bg-pink-600 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-150 shadow-md hover:shadow-lg";
  const mobileContactButtonClasses = "block w-full text-center bg-pink-500 text-white hover:bg-pink-600 px-4 py-3 rounded-lg text-base font-semibold transition-colors duration-150 shadow-md hover:shadow-lg mt-2";

  return (
    <header className="bg-white text-gray-700 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <i className="fas fa-spa mr-2 text-3xl sm:text-4xl text-pink-500"></i>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-800">
            마사지 파인더
          </h1>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-2">
          <a href="#" className={navLinkClasses}>
            홈
          </a>
          <a href="#" className={navLinkClasses}>
            인기 샵
          </a>
          <a href="#" className={contactButtonClasses}>
            문의하기
          </a>
        </nav>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button
            ref={buttonRef}
            onClick={toggleMobileMenu}
            className="text-gray-600 hover:text-pink-500 focus:outline-none p-2"
            aria-label="메뉴 열기"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
          >
            <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'} text-2xl`}></i>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div
          id="mobile-menu"
          ref={menuRef}
          className="md:hidden absolute top-full left-0 right-0 bg-white shadow-xl z-40 border-t border-gray-200"
          role="menu"
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <a href="#" className={mobileNavLinkClasses} role="menuitem" onClick={() => setIsMobileMenuOpen(false)}>
              홈
            </a>
            <a href="#" className={mobileNavLinkClasses} role="menuitem" onClick={() => setIsMobileMenuOpen(false)}>
              인기 샵
            </a>
            <a href="#" className={mobileContactButtonClasses} role="menuitem" onClick={() => setIsMobileMenuOpen(false)}>
              문의하기
            </a>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
