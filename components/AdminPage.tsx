
import React, { useState, useEffect, useCallback } from 'react';
import BulkImport from './BulkImport';
import ShopRegistrationForm from './ShopRegistrationForm';
import { MassageShop } from '../types';
import { fetchShopsFromFirestore, deleteShopFromFirestore } from '../firebase';

interface AdminPageProps {
  onImportSuccess: () => void; // Used to tell App.tsx to reload its shops
  onClose: () => void;
}

const AdminPage: React.FC<AdminPageProps> = ({ onImportSuccess, onClose }) => {
  const [adminShops, setAdminShops] = useState<MassageShop[]>([]);
  const [isLoadingShops, setIsLoadingShops] = useState<boolean>(true);
  const [shopError, setShopError] = useState<string | null>(null);
  const [editingShop, setEditingShop] = useState<MassageShop | null>(null);

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
    setEditingShop(null); // Clear editing state
    loadAdminShops();     // Reload admin's list
    onImportSuccess();    // Reload app's list
    alert(editingShop ? '샵 정보가 성공적으로 업데이트되었습니다.' : '새로운 샵 정보가 성공적으로 등록되었습니다.');
  };

  const handleEditShop = (shop: MassageShop) => {
    setEditingShop(shop);
    // Scroll to the form for better UX, if possible
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
        loadAdminShops();   // Reload admin's list
        onImportSuccess();  // Reload app's list
      } catch (e: any) {
        console.error("Error deleting shop:", e);
        alert(`샵 정보 삭제 중 오류 발생: ${e.message}`);
      }
    }
  };

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
          <h2 className="text-2xl font-semibold text-pink-700 mb-6 border-b border-pink-200 pb-3 flex items-center">
            <i className="fas fa-list-alt mr-2 text-pink-500"></i>기존 샵 관리
          </h2>
          {isLoadingShops && <p className="text-center text-pink-500 py-4">샵 목록을 불러오는 중...</p>}
          {shopError && <p className="text-center text-red-500 py-4">{shopError}</p>}
          {!isLoadingShops && !shopError && adminShops.length === 0 && (
            <p className="text-center text-pink-500 py-4">등록된 샵이 없습니다.</p>
          )}
          {!isLoadingShops && !shopError && adminShops.length > 0 && (
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
                  {adminShops.map((shop) => (
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
