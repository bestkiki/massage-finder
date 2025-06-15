
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import ShopList from './components/ShopList';
import SearchBar from './components/SearchBar';
import AdminPage from './components/AdminPage';
import ShopDetailPage from './components/ShopDetailPage';
import { MassageShop } from './types';
import { fetchShopsFromFirestore } from './firebase'; 

// IMPORTANT SECURITY NOTE:
// The password "m570318" is hardcoded here for simplicity in this demo.
// This is NOT secure for a production environment as it can be easily found
// in the client-side code. For real applications, use proper server-side
// authentication.
const ADMIN_PASSWORD = "m570318";

const App: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [allShops, setAllShops] = useState<MassageShop[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false); // State for admin auth
  const [selectedShop, setSelectedShop] = useState<MassageShop | null>(null);

  const loadShops = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const shopsFromFirestore = await fetchShopsFromFirestore();
      setAllShops(shopsFromFirestore);
    } catch (e: any) {
      console.error("Error loading shops:", e?.message || String(e));
      setError('마사지 샵 정보를 불러오는 데 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Load shops if not in admin view or if admin view is closed
    if (!isAdminAuthenticated) {
        loadShops();
    }
  }, [loadShops, isAdminAuthenticated]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleSelectShop = (shop: MassageShop) => {
    setSelectedShop(shop);
  };

  const handleCloseShopDetail = () => {
    setSelectedShop(null);
  };

  const handleAdminAccessRequest = () => {
    const passwordAttempt = window.prompt("관리자 페이지에 접속하려면 비밀번호를 입력하세요:");
    if (passwordAttempt === ADMIN_PASSWORD) {
      setIsAdminAuthenticated(true);
    } else if (passwordAttempt !== null) { // User entered something but it was wrong
      alert("비밀번호가 올바르지 않습니다.");
    }
    // If passwordAttempt is null (user pressed Cancel), do nothing.
  };

  const handleCloseAdminPage = () => {
    setIsAdminAuthenticated(false);
    // Reload shops when exiting admin page, in case changes were made
    loadShops();
  };


  const filteredShops = useMemo(() => {
    const cleanedSearchTerm = searchTerm.trim().toLowerCase();
    if (!cleanedSearchTerm) {
      return allShops;
    }

    const keywords = cleanedSearchTerm.split(' ').filter(kw => kw.length > 0);

    return allShops.filter(shop => {
      return keywords.every(keyword => {
        const shopName = shop.name.toLowerCase();
        const shopDescription = shop.description.toLowerCase();
        const shopAddress = shop.address.toLowerCase();
        const servicesPreviewMatch = shop.servicesPreview && shop.servicesPreview.some(sp => sp.toLowerCase().includes(keyword));
        const detailedServicesMatch = shop.detailedServices && shop.detailedServices.some(ds => 
          ds.name.toLowerCase().includes(keyword) || 
          ds.price.toLowerCase().includes(keyword)
        );

        return (
          shopName.includes(keyword) ||
          shopDescription.includes(keyword) ||
          shopAddress.includes(keyword) ||
          servicesPreviewMatch ||
          detailedServicesMatch
        );
      });
    });
  }, [searchTerm, allShops]);

  if (isAdminAuthenticated) {
    return <AdminPage onImportSuccess={loadShops} onClose={handleCloseAdminPage} />;
  }

  if (selectedShop) {
    return (
      <ShopDetailPage 
        shop={selectedShop} 
        onClose={handleCloseShopDetail} 
        onShopDataNeedsRefresh={loadShops}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <section className="text-center py-12 md:py-20 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl shadow-2xl mb-10 md:mb-16">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6 tracking-tight">
            내 주변 최고의 <span className="block sm:inline">마사지 샵</span> 찾기
          </h2>
          <p className="text-lg sm:text-xl text-pink-100 mb-10 max-w-2xl mx-auto px-4">
            이름, 지역, 서비스 키워드로 검색하여 당신에게 꼭 맞는 휴식을 찾아보세요.
          </p>
          <div className="max-w-xl mx-auto px-4">
            <SearchBar onSearch={handleSearch} />
          </div>
        </section>

        {isLoading && (
          <div className="text-center py-12">
            <div role="status" className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-pink-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" aria-label="로딩 중">
            </div>
            <p className="text-xl text-pink-700 mt-4 font-semibold">샵 정보를 불러오는 중입니다...</p>
          </div>
        )}

        {!isLoading && error && (
          <div className="text-center py-12 bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto shadow-lg">
            <i className="fas fa-exclamation-circle text-5xl text-red-500 mb-5"></i>
            <p className="text-2xl text-red-700 font-semibold mb-2">오류 발생</p>
            <p className="text-red-600 mb-4">{error}</p>
            <p className="text-gray-500 text-sm">
              문제가 지속되면 네트워크 연결을 확인하거나 잠시 후 다시 시도해주세요.
            </p>
          </div>
        )}

        {!isLoading && !error && filteredShops.length > 0 && (
          <ShopList shops={filteredShops} onViewDetails={handleSelectShop} />
        )}

        {!isLoading && !error && filteredShops.length === 0 && (
          <div className="text-center py-12 bg-rose-50 border border-rose-100 rounded-lg p-6 max-w-2xl mx-auto shadow-lg">
            <i className="fas fa-search text-5xl text-pink-300 mb-5"></i>
            {allShops.length === 0 && !searchTerm.trim() ? (
               <p className="text-2xl text-pink-700 font-semibold mb-2">등록된 마사지 샵 정보가 없습니다.</p>
            ) : (
              <p className="text-2xl text-pink-700 font-semibold mb-2">"{searchTerm}"에 대한 검색 결과가 없습니다.</p>
            )}
            <p className="text-pink-500 mb-4">다른 검색어를 사용해보거나 필터를 조정해보세요.</p>
             {allShops.length === 0 && !searchTerm.trim() && (
                <p className="text-sm text-pink-400">
                    관리자 페이지에서 샵 정보를 추가할 수 있습니다.
                </p>
            )}
          </div>
        )}
      </main>
      <Footer>
        <div className="mt-4">
            <button
                onClick={handleAdminAccessRequest} // Updated to call password prompt
                className="text-pink-500 hover:text-pink-400 text-sm font-medium transition-colors duration-150"
                aria-label="관리자 페이지로 이동"
            >
                <i className="fas fa-user-cog mr-1.5"></i> 관리자 페이지
            </button>
        </div>
      </Footer>
    </div>
  );
};

export default App;
