
import React, { useState, FormEvent } from 'react';
import Header from './Header';
import Footer from './Footer';
import { addShopInquiryToFirestore } from '../firebase'; // Import Firestore function

interface ShopInquiryPageProps {
  onClose: () => void;
}

interface InquiryFormState {
  ownerName: string;
  contactNumber: string;
  email: string;
  shopName: string;
  shopLocation: string;
  inquiryDetails: string;
}

const initialFormState: InquiryFormState = {
  ownerName: '',
  contactNumber: '',
  email: '',
  shopName: '',
  shopLocation: '',
  inquiryDetails: '',
};

const ShopInquiryPage: React.FC<ShopInquiryPageProps> = ({ onClose }) => {
  const [formData, setFormData] = useState<InquiryFormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!formData.ownerName.trim() || !formData.contactNumber.trim() || !formData.email.trim() || !formData.shopName.trim() || !formData.inquiryDetails.trim()) {
      setError('모든 필수 항목(*)을 입력해주세요.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
        setError('유효한 이메일 주소를 입력해주세요.');
        return;
    }

    setIsSubmitting(true);

    try {
      await addShopInquiryToFirestore({
        ownerName: formData.ownerName,
        contactNumber: formData.contactNumber,
        email: formData.email,
        shopName: formData.shopName,
        shopLocation: formData.shopLocation,
        inquiryDetails: formData.inquiryDetails,
      });
      
      setSuccessMessage('문의가 성공적으로 접수되었습니다. 관리자가 확인 후 연락드릴 예정입니다.');
      setFormData(initialFormState); // Reset form

    } catch (e: any) {
      console.error("Shop inquiry submission error:", e);
      setError(`문의 제출 중 오류가 발생했습니다: ${e.message || '알 수 없는 오류'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const commonInputClass = "mt-1 block w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 sm:text-sm transition-colors duration-150";
  const commonLabelClass = "block text-sm font-semibold text-slate-700";
  const requiredSpan = <span className="text-red-500 ml-1">*</span>;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
      <Header onNavigateHome={onClose} onNavigateToInquiry={() => { /* Already on this page */ }} />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={onClose}
            className="mb-6 bg-pink-100 hover:bg-pink-200 text-pink-700 font-semibold py-2 px-4 rounded-lg transition-colors duration-150 text-sm flex items-center shadow hover:shadow-md"
            aria-label="메인으로 돌아가기"
          >
            <i className="fas fa-arrow-left mr-2"></i> 메인으로 돌아가기
          </button>

          <div className="bg-white p-6 md:p-10 rounded-xl shadow-2xl border border-pink-100">
            <h1 className="text-2xl md:text-3xl font-bold text-pink-700 mb-2 text-center">
              <i className="fas fa-store-alt mr-2"></i> 샵 입점 문의
            </h1>
            <p className="text-slate-600 text-center mb-6 md:mb-8 text-sm md:text-base">
              마사지 파인더에 입점을 원하시는 사장님께서는 아래 정보를 입력 후 제출해주세요.<br/>
              검토 후 신속하게 연락드리겠습니다.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm" role="alert">{error}</div>}
              {successMessage && <div className="p-3 bg-green-100 border border-green-300 text-green-700 rounded-md text-sm" role="alert">{successMessage}</div>}

              <div>
                <label htmlFor="ownerName" className={commonLabelClass}>사장님 성함 {requiredSpan}</label>
                <input type="text" name="ownerName" id="ownerName" value={formData.ownerName} onChange={handleChange} className={commonInputClass} required disabled={isSubmitting} placeholder="홍길동"/>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="contactNumber" className={commonLabelClass}>연락처 {requiredSpan}</label>
                  <input type="tel" name="contactNumber" id="contactNumber" value={formData.contactNumber} onChange={handleChange} className={commonInputClass} required disabled={isSubmitting} placeholder="010-1234-5678"/>
                </div>
                <div>
                  <label htmlFor="email" className={commonLabelClass}>이메일 주소 {requiredSpan}</label>
                  <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className={commonInputClass} required disabled={isSubmitting} placeholder="owner@example.com"/>
                </div>
              </div>

              <div>
                <label htmlFor="shopName" className={commonLabelClass}>샵 이름 {requiredSpan}</label>
                <input type="text" name="shopName" id="shopName" value={formData.shopName} onChange={handleChange} className={commonInputClass} required disabled={isSubmitting} placeholder="힐링 테라피 강남점"/>
              </div>

              <div>
                <label htmlFor="shopLocation" className={commonLabelClass}>샵 예상 위치 (선택)</label>
                <input type="text" name="shopLocation" id="shopLocation" value={formData.shopLocation} onChange={handleChange} className={commonInputClass} disabled={isSubmitting} placeholder="서울시 강남구 테헤란로 123"/>
              </div>

              <div>
                <label htmlFor="inquiryDetails" className={commonLabelClass}>간단한 샵 소개 및 문의 내용 {requiredSpan}</label>
                <textarea
                  name="inquiryDetails"
                  id="inquiryDetails"
                  value={formData.inquiryDetails}
                  onChange={handleChange}
                  rows={5}
                  className={commonInputClass}
                  required
                  disabled={isSubmitting}
                  placeholder="예: 강남역 인근에서 50평 규모의 아로마 전문샵 오픈 예정입니다. 입점 절차 및 수수료 관련 문의드립니다."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-base font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-150 ease-in-out"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    제출 중...
                  </>
                ) : (
                  <><i className="fas fa-paper-plane mr-2"></i> 문의 제출하기</>
                )}
              </button>
            </form>
             <p className="mt-6 text-xs text-slate-500 text-center">
                <i className="fas fa-info-circle mr-1"></i>
                제출된 정보는 관리자 페이지에서 검토 후 연락드립니다.
              </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ShopInquiryPage;
