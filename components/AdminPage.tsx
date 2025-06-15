import React, { useState, useEffect, useCallback, useMemo } from 'react';
import BulkImport from './BulkImport';
import ShopRegistrationForm from './ShopRegistrationForm';
import { MassageShop } from '../types';
import { fetchShopsFromFirestore, deleteShopFromFirestore } from '../firebase';
import SearchIcon from './icons/SearchIcon'; // Import SearchIcon

interface AdminPageProps {
  onImportSuccess: () => void; // Used to tell App.tsx to reload its shops
  onClose: () => void;
}

const AdminPage: React.FC<AdminPageProps> = ({ onImportSuccess, onClose }) => {
  const [adminShops, setAdminShops] = useState<MassageShop[]>([]);
  const [isLoadingShops, setIsLoadingShops] = useState<boolean>(true);
  const [shopError, setShopError] = useState<string | null>(null);
  const [editingShop, setEditingShop] = useState<MassageShop | null>(null);
  const [adminSearchTerm, setAdminSearchTerm] = useState<string>(''); // State for admin shop search

  const loadAdminShops = useCallback(async () => {
    setIsLoadingShops(true);
    setShopError(null);
    try {
      const shops = await fetchShopsFromFirestore();
      setAdminShops(shops);
    } catch (e: any) {
      console.error("Error loading shops for admin:", e);
      setShopError('샵 목록을 불러오는 데 실패했습니다.');
    } finally {
      setIsLoadingShops(false);
    }
  }, []);

  useEffect(() => {
    loadAdminShops();
  }, [loadAdminShops]);

  const handleShopSaved = () => {
    setEditingShop(null); 
    loadAdminShops();     
    onImportSuccess();    
    alert(editingShop ? '샵 정보가 성공적으로 업데이트되었습니다.' : '새로운 샵 정보가 성공적으로 등록되었습니다.');
  };

  const handleEditShop = (shop: MassageShop) => {
    setEditingShop(shop);
    const formElement = document.getElementById('shop-registration-section');
    if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCancelEdit = () => {
    setEditingShop(null);
  };

  const handleDeleteShop = async (shopId: string, shopName: string) => {
    if (window.confirm(`정말로 '${shopName}' 샵 정보를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      try {
        await deleteShopFromFirestore(shopId);
        alert(`'${shopName}' 샵 정보가 삭제되었습니다.`);
        loadAdminShops();   
        onImportSuccess();  
      } catch (e: any) {
        console.error("Error deleting shop:", e);
        alert(`샵 정보 삭제 중 오류 발생: ${e.message}`);
      }
    }
  };

  const handleAdminSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAdminSearchTerm(event.target.value);
  };

  const filteredAdminShops = useMemo(() => {
    const cleanedSearchTerm = adminSearchTerm.trim().toLowerCase();
    if (!cleanedSearchTerm) {
      return adminShops;
    }
    return adminShops.filter(shop => 
      shop.name.toLowerCase().includes(cleanedSearchTerm) ||
      shop.address.toLowerCase().includes(cleanedSearchTerm)
    );
  }, [adminSearchTerm, adminShops]);

  return (
    <div className="min-h-screen flex flex-col bg-rose-50">
      <header className="bg-gradient-to-r from-pink-600 to-rose-500 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-5 flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            <i className="fas fa-user-shield mr-2"></i>관리자 페이지
          </h1>
          <button
            onClick={onClose}
            className="bg-rose-500 hover:bg-rose-600 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-150 ease-in-out flex items-center shadow-md"
          >
            <i className="fas fa-arrow-left mr-2"></i>메인으로 돌아가기
          </button>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8 space-y-12">
        {/* Section for Single Shop Registration / Edit */}
        <section id="shop-registration-section" className="bg-white p-6 md:p-8 rounded-xl shadow-xl border border-pink-100">
          <h2 className="text-2xl font-semibold text-pink-700 mb-6 border-b border-pink-200 pb-3 flex items-center">
            {editingShop ? (
              <><i className="fas fa-edit mr-2 text-pink-500"></i>샵 정보 수정</>
            ) : (
              <><i className="fas fa-plus-circle mr-2 text-pink-500"></i>개별 샵 등록</>
            )}
          </h2>
          <ShopRegistrationForm
            existingShop={editingShop}
            onShopSaved={handleShopSaved}
            onCancelEdit={editingShop ? handleCancelEdit : undefined}
          />
        </section>

        {/* Section for Existing Shops Management */}
        <section className="bg-white p-6 md:p-8 rounded-xl shadow-xl border border-pink-100">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 border-b border-pink-200 pb-3">
            <h2 className="text-2xl font-semibold text-pink-700 flex items-center mb-3 sm:mb-0">
              <i className="fas fa-list-alt mr-2 text-pink-500"></i>기존 샵 관리
            </h2>
            <div className="relative w-full sm:w-72">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="샵 이름 또는 주소 검색..."
                value={adminSearchTerm}
                onChange={handleAdminSearchChange}
                className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-gray-400 focus:outline-none focus:placeholder-gray-300 focus:ring-1 focus:ring-pink-500 focus:border-pink-500 sm:text-sm shadow-sm"
              />
               {adminSearchTerm && (
                 <button
                    type="button"
                    onClick={() => setAdminSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Clear search"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
               )}
            </div>
          </div>

          {isLoadingShops && <p className="text-center text-pink-500 py-4">샵 목록을 불러오는 중...</p>}
          {shopError && <p className="text-center text-red-500 py-4">{shopError}</p>}
          
          {!isLoadingShops && !shopError && adminShops.length === 0 && (
            <p className="text-center text-pink-500 py-4">등록된 샵이 없습니다.</p>
          )}

          {!isLoadingShops && !shopError && adminShops.length > 0 && filteredAdminShops.length === 0 && (
            <p className="text-center text-pink-500 py-4">"{adminSearchTerm}"에 대한 검색 결과가 없습니다.</p>
          )}

          {!isLoadingShops && !shopError && filteredAdminShops.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-pink-200">
                <thead className="bg-rose-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-pink-600 uppercase tracking-wider">이름</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-pink-600 uppercase tracking-wider">주소</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-pink-600 uppercase tracking-wider">평점</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-pink-600 uppercase tracking-wider">관리</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-pink-100">
                  {filteredAdminShops.map((shop) => (
                    <tr key={shop.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{shop.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{shop.address}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{shop.rating.toFixed(1)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEditShop(shop)}
                          className="text-pink-600 hover:text-pink-800 transition-colors"
                          aria-label={`샵 '${shop.name}' 수정`}
                        >
                          <i className="fas fa-edit mr-1"></i>수정
                        </button>
                        <button
                          onClick={() => handleDeleteShop(shop.id, shop.name)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          aria-label={`샵 '${shop.name}' 삭제`}
                        >
                          <i className="fas fa-trash-alt mr-1"></i>삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Section for Bulk Import */}
        <section className="bg-white p-6 md:p-8 rounded-xl shadow-xl border border-pink-100">
           <h2 className="text-2xl font-semibold text-pink-700 mb-6 border-b border-pink-200 pb-3 flex items-center">
            <i className="fas fa-file-upload mr-2 text-pink-500"></i>샵 정보 대량 등록 (Excel/CSV)
          </h2>
          <BulkImport onImportSuccess={() => {
            alert('샵 정보가 성공적으로 대량 등록되었으며, 목록이 업데이트됩니다.');
            loadAdminShops(); // Reload admin's list
            onImportSuccess(); // Reload app's list
          }} />
        </section>
      </main>

      <footer className="bg-gradient-to-r from-pink-600 to-rose-500 text-pink-100 py-8 text-center">
        <div className="container mx-auto px-4">
          <p>&copy; {new Date().getFullYear()} 마사지 파인더 (관리자 모드)</p>
        </div>
      </footer>
    </div>
  );
};

export default AdminPage;