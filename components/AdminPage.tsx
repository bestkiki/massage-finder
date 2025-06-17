
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import BulkImport from './BulkImport';
import ShopRegistrationForm from './ShopRegistrationForm';
import { MassageShop, Service, ShopInquiry, ShopInquiryStatus } from '../types';
import { 
  fetchShopsFromFirestore, 
  deleteShopFromFirestore,
  fetchShopInquiriesFromFirestore,
  updateShopInquiryStatusInFirestore,
  deleteShopInquiryFromFirestore
} from '../firebase';
import SearchIcon from './icons/SearchIcon';
import * as XLSX from 'xlsx'; // Import xlsx library
import firebase from 'firebase/compat/app'; // For Timestamp type

interface AdminPageProps {
  onImportSuccess: () => void;
  onClose: () => void;
}

const AdminPage: React.FC<AdminPageProps> = ({ onImportSuccess, onClose }) => {
  const [adminShops, setAdminShops] = useState<MassageShop[]>([]);
  const [isLoadingShops, setIsLoadingShops] = useState<boolean>(true);
  const [shopError, setShopError] = useState<string | null>(null);
  const [editingShop, setEditingShop] = useState<MassageShop | null>(null);
  const [adminSearchTerm, setAdminSearchTerm] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // State for Shop Inquiries
  const [shopInquiries, setShopInquiries] = useState<ShopInquiry[]>([]);
  const [isLoadingInquiries, setIsLoadingInquiries] = useState<boolean>(true);
  const [inquiryError, setInquiryError] = useState<string | null>(null);
  const [expandedInquiryId, setExpandedInquiryId] = useState<string | null>(null);


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

  const loadShopInquiries = useCallback(async () => {
    setIsLoadingInquiries(true);
    setInquiryError(null);
    try {
      const inquiries = await fetchShopInquiriesFromFirestore();
      setShopInquiries(inquiries);
    } catch (e: any) {
      console.error("Error loading shop inquiries:", e);
      setInquiryError('샵 입점 문의 목록을 불러오는 데 실패했습니다.');
    } finally {
      setIsLoadingInquiries(false);
    }
  }, []);

  useEffect(() => {
    loadAdminShops();
    loadShopInquiries();
  }, [loadAdminShops, loadShopInquiries]);

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

  const handleExportShops = useCallback(async () => {
    if (adminShops.length === 0) {
      alert("내보낼 샵 정보가 없습니다.");
      return;
    }
    setIsExporting(true);
    try {
      const dataToExport = adminShops.map(shop => ({
        name: shop.name,
        description: shop.description,
        address: shop.address,
        imageUrl: shop.imageUrl,
        rating: shop.rating,
        reviewCount: shop.reviewCount,
        servicesPreview: shop.servicesPreview.join(','), 
        phoneNumber: shop.phoneNumber,
        operatingHours: shop.operatingHours,
        detailedServices: JSON.stringify(shop.detailedServices),
        isRecommended: shop.isRecommended ? 'TRUE' : 'FALSE',
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Shops");

      const date = new Date();
      const filename = `마사지샵_백업_${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}.xlsx`;
      
      XLSX.writeFile(workbook, filename);
      alert("샵 정보가 Excel 파일로 성공적으로 내보내졌습니다.");

    } catch (error) {
      console.error("Error exporting shops:", error);
      alert("샵 정보 내보내기 중 오류가 발생했습니다.");
    } finally {
      setIsExporting(false);
    }
  }, [adminShops]);

  // --- Shop Inquiry Management ---
  const handleUpdateInquiryStatus = async (inquiryId: string, status: ShopInquiryStatus) => {
    if (!window.confirm(`정말로 이 문의의 상태를 '${status === 'new' ? '새 문의' : status === 'read' ? '읽음' : '연락 완료'}'(으)로 변경하시겠습니까?`)) return;
    try {
      await updateShopInquiryStatusInFirestore(inquiryId, status);
      alert('문의 상태가 업데이트되었습니다.');
      loadShopInquiries(); // Refresh the list
    } catch (e: any) {
      alert(`상태 업데이트 실패: ${e.message}`);
    }
  };

  const handleDeleteInquiry = async (inquiryId: string, shopName: string) => {
    if (window.confirm(`'${shopName}' 관련 입점 문의를 정말로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      try {
        await deleteShopInquiryFromFirestore(inquiryId);
        alert('입점 문의가 삭제되었습니다.');
        loadShopInquiries(); // Refresh the list
      } catch (e: any) {
        alert(`문의 삭제 실패: ${e.message}`);
      }
    }
  };

  const toggleExpandInquiry = (inquiryId: string) => {
    setExpandedInquiryId(expandedInquiryId === inquiryId ? null : inquiryId);
  };
  
  const formatDate = (timestamp?: firebase.firestore.Timestamp): string => {
    if (!timestamp) return 'N/A';
    return timestamp.toDate().toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusKorean = (status: ShopInquiryStatus) => {
    switch (status) {
      case 'new': return '새 문의';
      case 'read': return '읽음';
      case 'contacted': return '연락 완료';
      default: return status;
    }
  };

  const getStatusColorClass = (status: ShopInquiryStatus) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'read': return 'bg-yellow-100 text-yellow-800';
      case 'contacted': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
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

        <section className="bg-white p-6 md:p-8 rounded-xl shadow-xl border border-pink-100">
           <h2 className="text-2xl font-semibold text-pink-700 mb-6 border-b border-pink-200 pb-3 flex items-center">
            <i className="fas fa-database mr-2 text-pink-500"></i>데이터 관리
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-pink-600 mb-3 flex items-center">
                <i className="fas fa-file-upload mr-2"></i>샵 정보 대량 등록 (Excel/CSV)
              </h3>
              <BulkImport onImportSuccess={() => {
                alert('샵 정보가 성공적으로 대량 등록되었으며, 목록이 업데이트됩니다.');
                loadAdminShops(); 
                onImportSuccess(); 
              }} />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-pink-600 mb-3 flex items-center">
                <i className="fas fa-file-download mr-2"></i>샵 정보 Excel로 내보내기
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                현재 등록된 모든 샵 정보를 Excel 파일로 다운로드합니다. 이 파일은 대량 등록 양식과 호환됩니다.
              </p>
              <button
                onClick={handleExportShops}
                disabled={isExporting || adminShops.length === 0}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 transition-all duration-150 ease-in-out disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isExporting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    내보내는 중...
                  </>
                ) : (
                  <><i className="fas fa-file-excel mr-2"></i>전체 샵 정보 내보내기</>
                )}
              </button>
               {adminShops.length === 0 && !isLoadingShops && (
                <p className="mt-2 text-xs text-slate-500">내보낼 샵 정보가 없습니다.</p>
              )}
            </div>
          </div>
        </section>

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
                className="block w-full pl-10 pr-10 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-gray-400 focus:outline-none focus:placeholder-gray-300 focus:ring-1 focus:ring-pink-500 focus:border-pink-500 sm:text-sm shadow-sm"
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
            <p className="text-center text-pink-500 py-4">등록된 샵이 없습니다. '데이터 관리' 섹션에서 샵 정보를 등록하거나 가져올 수 있습니다.</p>
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
                    <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-pink-600 uppercase tracking-wider">추천</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-pink-600 uppercase tracking-wider">관리</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-pink-100">
                  {filteredAdminShops.map((shop) => (
                    <tr key={shop.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{shop.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{shop.address}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{shop.rating.toFixed(1)}</td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-600 text-center">
                        {shop.isRecommended ? 
                            <i className="fas fa-check-circle text-green-500 text-lg" title="추천됨"></i> : 
                            <i className="fas fa-minus-circle text-slate-300 text-lg" title="추천 안됨"></i>
                        }
                      </td>
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

        {/* Shop Inquiry Management Section */}
        <section className="bg-white p-6 md:p-8 rounded-xl shadow-xl border border-pink-100">
          <h2 className="text-2xl font-semibold text-pink-700 mb-6 border-b border-pink-200 pb-3 flex items-center">
            <i className="fas fa-envelope-open-text mr-2 text-pink-500"></i>샵 입점 문의 관리 ({shopInquiries.length})
          </h2>
          {isLoadingInquiries && <p className="text-center text-pink-500 py-4">입점 문의 목록을 불러오는 중...</p>}
          {inquiryError && <p className="text-center text-red-500 py-4">{inquiryError}</p>}
          
          {!isLoadingInquiries && !inquiryError && shopInquiries.length === 0 && (
            <p className="text-center text-slate-500 py-4">새로운 입점 문의가 없습니다.</p>
          )}

          {!isLoadingInquiries && !inquiryError && shopInquiries.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-pink-200">
                <thead className="bg-rose-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-pink-600 uppercase tracking-wider">접수일</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-pink-600 uppercase tracking-wider">샵 이름</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-pink-600 uppercase tracking-wider">문의자</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-pink-600 uppercase tracking-wider">상태</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-pink-600 uppercase tracking-wider">관리</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-pink-100">
                  {shopInquiries.map((inquiry) => (
                    <React.Fragment key={inquiry.id}>
                      <tr>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{formatDate(inquiry.createdAt)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">{inquiry.shopName}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{inquiry.ownerName}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColorClass(inquiry.status)}`}>
                            {getStatusKorean(inquiry.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => toggleExpandInquiry(inquiry.id)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            aria-label={`문의 '${inquiry.shopName}' 상세 보기`}
                          >
                            <i className={`fas ${expandedInquiryId === inquiry.id ? 'fa-chevron-up' : 'fa-chevron-down'} mr-1`}></i>
                            {expandedInquiryId === inquiry.id ? '숨기기' : '상세'}
                          </button>
                           <select 
                              value={inquiry.status}
                              onChange={(e) => handleUpdateInquiryStatus(inquiry.id, e.target.value as ShopInquiryStatus)}
                              className="text-xs p-1 border border-slate-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                              aria-label={`문의 '${inquiry.shopName}' 상태 변경`}
                            >
                              <option value="new">새 문의</option>
                              <option value="read">읽음</option>
                              <option value="contacted">연락 완료</option>
                            </select>
                          <button
                            onClick={() => handleDeleteInquiry(inquiry.id, inquiry.shopName)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            aria-label={`문의 '${inquiry.shopName}' 삭제`}
                          >
                            <i className="fas fa-trash-alt mr-1"></i>삭제
                          </button>
                        </td>
                      </tr>
                      {expandedInquiryId === inquiry.id && (
                        <tr>
                          <td colSpan={5} className="p-0">
                            <div className="p-4 bg-rose-50 border-l-4 border-pink-500">
                              <h4 className="text-sm font-semibold text-pink-700 mb-2">문의 상세 내용:</h4>
                              <p className="text-xs text-slate-700 mb-1"><strong>이메일:</strong> {inquiry.email}</p>
                              <p className="text-xs text-slate-700 mb-1"><strong>연락처:</strong> {inquiry.contactNumber}</p>
                              {inquiry.shopLocation && <p className="text-xs text-slate-700 mb-1"><strong>예상 위치:</strong> {inquiry.shopLocation}</p>}
                              <p className="text-xs text-slate-700 whitespace-pre-wrap mt-2 pt-2 border-t border-pink-200">
                                {inquiry.inquiryDetails}
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
