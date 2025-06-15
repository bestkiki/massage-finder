
import React, { useState, FormEvent, useEffect } from 'react';
import { addShopToFirestore, updateShopInFirestore } from '../firebase';
import { MassageShop, Service } from '../types';

interface ShopRegistrationFormProps {
  existingShop?: MassageShop | null;
  onShopSaved: () => void;
  onCancelEdit?: () => void;
}

const getInitialShopData = (): Omit<MassageShop, 'id'> => ({
  name: '',
  description: '',
  address: '',
  imageUrl: '',
  rating: 0,
  reviewCount: 0, // Initialize reviewCount
  servicesPreview: [],
  phoneNumber: '',
  operatingHours: '',
  detailedServices: [], // Initialize as empty array
});

const ShopRegistrationForm: React.FC<ShopRegistrationFormProps> = ({ existingShop, onShopSaved, onCancelEdit }) => {
  const [shopData, setShopData] = useState<Omit<MassageShop, 'id'>>(getInitialShopData());
  const [servicesPreviewInput, setServicesPreviewInput] = useState<string>('');
  // detailedServicesInput state is removed
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isEditMode = !!existingShop;

  useEffect(() => {
    if (isEditMode && existingShop) {
      setShopData({
        name: existingShop.name,
        description: existingShop.description,
        address: existingShop.address,
        imageUrl: existingShop.imageUrl,
        rating: existingShop.rating,
        reviewCount: existingShop.reviewCount || 0, // Ensure reviewCount is set
        servicesPreview: existingShop.servicesPreview,
        phoneNumber: existingShop.phoneNumber,
        operatingHours: existingShop.operatingHours,
        detailedServices: Array.isArray(existingShop.detailedServices) ? existingShop.detailedServices : [], // Ensure it's an array
      });
      setServicesPreviewInput(existingShop.servicesPreview.join(', '));
      // No need to set detailedServicesInput
    } else {
      setShopData(getInitialShopData());
      setServicesPreviewInput('');
      // No need to set detailedServicesInput
    }
  }, [existingShop, isEditMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setShopData(prev => ({ 
        ...prev, 
        [name]: name === 'rating' || name === 'reviewCount' ? parseFloat(value) : value 
    }));
  };

  const handleServicesPreviewChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setServicesPreviewInput(e.target.value);
  };

  // New handlers for dynamic detailedServices
  const handleDetailedServiceChange = (index: number, field: keyof Service, value: string) => {
    setShopData(prev => {
      const newDetailedServices = [...prev.detailedServices];
      newDetailedServices[index] = { ...newDetailedServices[index], [field]: value };
      return { ...prev, detailedServices: newDetailedServices };
    });
  };

  const addDetailedService = () => {
    setShopData(prev => ({
      ...prev,
      detailedServices: [...prev.detailedServices, { name: '', price: '' }],
    }));
  };

  const removeDetailedService = (index: number) => {
    setShopData(prev => ({
      ...prev,
      detailedServices: prev.detailedServices.filter((_, i) => i !== index),
    }));
  };


  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!shopData.name.trim() || !shopData.description.trim() || !shopData.address.trim()) {
      setError('샵 이름, 설명, 주소는 필수 항목입니다.');
      return;
    }

    // Filter out empty services (both name and price are empty)
    const filteredDetailedServices = shopData.detailedServices.filter(
      s => s.name.trim() !== '' || s.price.trim() !== ''
    );
    
    // Optional: Validate if any service has a name but no price, or vice-versa
    for (const service of filteredDetailedServices) {
        if ((service.name.trim() && !service.price.trim()) || (!service.name.trim() && service.price.trim())) {
            setError('상세 서비스 항목 중 이름 또는 가격만 입력된 경우가 있습니다. 이름과 가격을 모두 입력하거나 해당 항목을 삭제해주세요.');
            return;
        }
    }


    const finalShopData: Omit<MassageShop, 'id'> = {
      ...shopData,
      imageUrl: shopData.imageUrl.trim() || 'https://picsum.photos/seed/defaultshop/600/400',
      servicesPreview: servicesPreviewInput.split(',').map(s => s.trim()).filter(s => s),
      detailedServices: filteredDetailedServices,
      rating: Math.max(0, Math.min(5, Number(shopData.rating) || 0)),
      reviewCount: Number(shopData.reviewCount) || 0, // Ensure reviewCount is a number
    };

    setIsSubmitting(true);
    try {
      if (isEditMode && existingShop) {
        // For updates, typically reviewCount and rating are updated by review submissions.
        // If admin edits rating, it's an override. Review count should likely be preserved.
        // The current firebase.ts logic updates rating/reviewCount on new review.
        // We pass the current shopData.reviewCount to ensure it's not lost if it was editable.
        await updateShopInFirestore(existingShop.id, finalShopData);
        setSuccessMessage('샵 정보가 성공적으로 업데이트되었습니다!');
      } else {
        await addShopToFirestore(finalShopData);
        setSuccessMessage('샵 정보가 성공적으로 등록되었습니다!');
      }
      if (!isEditMode) {
          setShopData(getInitialShopData()); // Resets detailedServices to []
          setServicesPreviewInput('');
      }
      if (onShopSaved) {
        onShopSaved();
      }
    } catch (submissionError: any) {
      setError(`${isEditMode ? '업데이트' : '등록'} 실패: ${submissionError.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const commonInputClass = "mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm";
  const commonLabelClass = "block text-sm font-medium text-slate-700";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-md" role="alert">{error}</div>}
      {successMessage && <div className="p-3 bg-green-100 border border-green-300 text-green-700 rounded-md" role="alert">{successMessage}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className={commonLabelClass}>샵 이름 <span className="text-red-500">*</span></label>
          <input type="text" name="name" id="name" value={shopData.name} onChange={handleChange} className={commonInputClass} required />
        </div>
        <div>
          <label htmlFor="address" className={commonLabelClass}>주소 <span className="text-red-500">*</span></label>
          <input type="text" name="address" id="address" value={shopData.address} onChange={handleChange} className={commonInputClass} required />
        </div>
      </div>

      <div>
        <label htmlFor="description" className={commonLabelClass}>설명 <span className="text-red-500">*</span></label>
        <textarea name="description" id="description" value={shopData.description} onChange={handleChange} rows={3} className={commonInputClass} required />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="imageUrl" className={commonLabelClass}>
            이미지 URL
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <input
              type="url"
              name="imageUrl"
              id="imageUrl"
              value={shopData.imageUrl}
              onChange={handleChange}
              className={`${commonInputClass} rounded-none rounded-l-md flex-1 !mt-0`}
              placeholder="https://example.com/image.jpg"
            />
            <button
              type="button"
              onClick={() => window.open('https://unsplash.com/s/photos/massage-therapy-spa', '_blank', 'noopener,noreferrer')}
              className="inline-flex items-center px-3 py-2 border border-l-0 border-slate-300 bg-slate-50 text-slate-700 rounded-r-md hover:bg-slate-100 focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 text-sm"
              title="Unsplash에서 'massage therapy spa' 검색 (새 창)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 md:mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              <span className="hidden md:inline">Unsplash</span>
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            직접 URL을 입력하거나, Unsplash 버튼으로 이미지를 검색한 후 이미지 주소를 복사하여 붙여넣으세요.
          </p>
        </div>
        <div>
          <label htmlFor="rating" className={commonLabelClass}>평점 (0-5)</label>
          <input type="number" name="rating" id="rating" value={shopData.rating} onChange={handleChange} min="0" max="5" step="0.1" className={commonInputClass} />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="phoneNumber" className={commonLabelClass}>전화번호</label>
          <input type="tel" name="phoneNumber" id="phoneNumber" value={shopData.phoneNumber} onChange={handleChange} className={commonInputClass} />
        </div>
        <div>
          <label htmlFor="operatingHours" className={commonLabelClass}>운영 시간</label>
          <input type="text" name="operatingHours" id="operatingHours" value={shopData.operatingHours} onChange={handleChange} className={commonInputClass} placeholder="예: 매일 10:00 - 22:00" />
        </div>
      </div>

       {/* Optional: Display reviewCount (read-only or editable) if needed. For now, it's handled internally.
       <div>
         <label htmlFor="reviewCount" className={commonLabelClass}>리뷰 수</label>
         <input type="number" name="reviewCount" id="reviewCount" value={shopData.reviewCount} onChange={handleChange} min="0" step="1" className={commonInputClass} />
       </div>
       */}

      <div>
        <label htmlFor="servicesPreviewInput" className={commonLabelClass}>주요 서비스 (쉼표로 구분)</label>
        <input type="text" name="servicesPreviewInput" id="servicesPreviewInput" value={servicesPreviewInput} onChange={handleServicesPreviewChange} className={commonInputClass} placeholder="예: 타이 마사지, 아로마 테라피, 발 마사지" />
      </div>

      {/* Detailed Services Dynamic List */}
      <div>
        <label className={commonLabelClass}>상세 서비스</label>
        {shopData.detailedServices.map((service, index) => (
          <div key={index} className="flex items-center space-x-2 mb-2 p-3 border border-pink-100 rounded-md bg-rose-50">
            <input
              type="text"
              placeholder="서비스명 (예: 전신 관리 60분)"
              value={service.name}
              onChange={(e) => handleDetailedServiceChange(index, 'name', e.target.value)}
              className={`${commonInputClass} flex-grow !mt-0`}
              aria-label={`상세 서비스 ${index + 1} 이름`}
            />
            <input
              type="text"
              placeholder="가격 (예: ₩50,000)"
              value={service.price}
              onChange={(e) => handleDetailedServiceChange(index, 'price', e.target.value)}
              className={`${commonInputClass} w-1/3 !mt-0`}
              aria-label={`상세 서비스 ${index + 1} 가격`}
            />
            <button
              type="button"
              onClick={() => removeDetailedService(index)}
              className="text-red-500 hover:text-red-700 p-2 rounded-md transition-colors duration-150 ease-in-out"
              aria-label={`상세 서비스 ${index + 1} 삭제`}
            >
              <i className="fas fa-trash-alt"></i>
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addDetailedService}
          className="mt-2 text-sm text-pink-600 hover:text-pink-700 font-medium py-2 px-3 border border-pink-300 rounded-md hover:bg-pink-50 transition-colors duration-150 ease-in-out flex items-center"
        >
          <i className="fas fa-plus mr-2"></i>상세 서비스 추가
        </button>
      </div>
      {/* End Detailed Services Dynamic List */}


      <div className="flex space-x-4 pt-4 border-t border-pink-200">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:bg-slate-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {isEditMode ? '업데이트 중...' : '등록 중...'}
            </>
          ) : (
            <><i className={`fas ${isEditMode ? 'fa-save' : 'fa-plus-circle'} mr-2`}></i>{isEditMode ? '샵 정보 업데이트' : '새 샵 등록하기'}</>
          )}
        </button>
        {isEditMode && onCancelEdit && (
          <button
            type="button"
            onClick={onCancelEdit}
            disabled={isSubmitting}
            className="w-full flex justify-center py-2.5 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:bg-slate-200 disabled:cursor-not-allowed"
          >
            <i className="fas fa-times mr-2"></i>취소
          </button>
        )}
      </div>
    </form>
  );
};

export default ShopRegistrationForm;