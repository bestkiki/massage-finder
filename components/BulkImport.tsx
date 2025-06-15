
import React, { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { db } from '../firebase'; // db is now firebase.firestore.Firestore from compat
import firebase from 'firebase/compat/app'; // Required for firebase.firestore types if not globally available
import 'firebase/compat/firestore'; // Ensure firestore compat is loaded
import { MassageShop, Service } from '../types';

interface BulkImportProps {
  onImportSuccess: () => void;
}

const BulkImport = ({ onImportSuccess }: BulkImportProps): JSX.Element => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorDetails, setErrorDetails] = useState<string[]>([]);
  const [showInstructions, setShowInstructions] = useState<boolean>(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const validTypes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'];
      if (validTypes.includes(file.type) || file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setSelectedFile(file);
        setStatusMessage('');
        setErrorDetails([]);
      } else {
        setSelectedFile(null);
        setStatusMessage('오류: .xlsx, .xls, .csv 형식의 파일만 지원됩니다.');
        setErrorDetails([]);
      }
    } else {
      setSelectedFile(null);
    }
  };

  const parseDetailedServices = useCallback((jsonString: string): Service[] => {
    if (!jsonString || typeof jsonString !== 'string') return [];
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed)) {
        return parsed.map(s => ({
          name: String(s.name || 'N/A').trim(),
          price: String(s.price || 'N/A').trim(),
        })).filter(s => s.name !== 'N/A' || s.price !== 'N/A');
      }
      return [];
    } catch (e) {
      console.warn('Failed to parse detailedServices JSON:', jsonString, e);
      let correctedJsonString = jsonString; // Initialize for the second catch block
      try {
        // Attempt to fix common issue with single quotes in JSON
        correctedJsonString = jsonString.replace(/'/g, '"');
        const parsedAgain = JSON.parse(correctedJsonString);
        if (Array.isArray(parsedAgain)) {
           return parsedAgain.map(s => ({
            name: String(s.name || 'N/A').trim(),
            price: String(s.price || 'N/A').trim(),
          })).filter(s => s.name !== 'N/A' || s.price !== 'N/A');
        }
      } catch (e2) {
        // still failed
        console.warn('Failed to parse detailedServices JSON after attempting to correct quotes:', correctedJsonString, e2);
      }
      return [];
    }
  }, []);

  const handleImport = useCallback(async () => {
    if (!selectedFile) {
      setStatusMessage('오류: 가져올 파일을 선택해주세요.');
      return;
    }

    setIsImporting(true);
    setStatusMessage('파일을 읽고 처리하는 중입니다...');
    setErrorDetails([]);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          throw new Error('파일을 읽는 데 실패했습니다.');
        }
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonRows = XLSX.utils.sheet_to_json<any>(worksheet, { defval: "", rawNumbers: false }); 

        if (jsonRows.length === 0) {
          setStatusMessage('오류: 파일에 데이터가 없습니다. 헤더 행이 올바른지, 데이터가 비어있지 않은지 확인해주세요.');
          setIsImporting(false);
          return;
        }
        
        setStatusMessage(`총 ${jsonRows.length}개의 행을 Firestore에 저장합니다...`);

        const shopsCollectionRef = db.collection('shops'); // Compat style
        let batch = db.batch(); // Compat style
        let operationsInBatch = 0;
        let successfulImports = 0;
        const currentErrorDetails: string[] = [];

        for (let i = 0; i < jsonRows.length; i++) {
          const row: any = jsonRows[i]; 
          const rowIndexForError = i + 2; 

          if (!row.name || !row.description || !row.address) {
            currentErrorDetails.push(`행 ${rowIndexForError}: 필수 필드(name, description, address) 중 하나 이상이 누락되었습니다. 이 행은 건너뜁니다.`);
            continue; 
          }

          let ratingValue: number;
          if (row.rating === "" || row.rating === undefined || row.rating === null) {
            ratingValue = 0;
          } else {
            const parsedRating = parseFloat(String(row.rating));
            if (isNaN(parsedRating)) {
              currentErrorDetails.push(`행 ${rowIndexForError}: 'rating' 값 ("${String(row.rating)}")이 유효한 숫자가 아닙니다. 0으로 설정됩니다.`);
              ratingValue = 0;
            } else {
              ratingValue = Math.max(0, Math.min(5, parsedRating));
            }
          }

          let reviewCountValue: number;
          if (row.reviewCount === "" || row.reviewCount === undefined || row.reviewCount === null) {
            reviewCountValue = 0;
          } else {
            const parsedReviewCount = parseInt(String(row.reviewCount), 10);
            if (isNaN(parsedReviewCount)) {
              currentErrorDetails.push(`행 ${rowIndexForError}: 'reviewCount' 값 ("${String(row.reviewCount)}")이 유효한 숫자가 아닙니다. 0으로 설정됩니다.`);
              reviewCountValue = 0;
            } else {
              reviewCountValue = Math.max(0, parsedReviewCount);
            }
          }
          
          const shopData: Omit<MassageShop, 'id'> = {
            name: String(row.name || '').trim(),
            description: String(row.description || '').trim(),
            address: String(row.address || '').trim(),
            imageUrl: String(row.imageUrl || '').trim() || 'https://picsum.photos/seed/placeholder/600/400',
            rating: ratingValue,
            reviewCount: reviewCountValue, // Added reviewCount
            servicesPreview: row.servicesPreview ? String(row.servicesPreview).split(',').map(s => s.trim()).filter(s => s) : [],
            phoneNumber: String(row.phoneNumber || '').trim() || '정보 없음',
            operatingHours: String(row.operatingHours || '').trim() || '정보 없음',
            detailedServices: row.detailedServices ? parseDetailedServices(String(row.detailedServices)) : [],
          };
          
          const newShopRef = shopsCollectionRef.doc(); // Compat style
          batch.set(newShopRef, shopData);
          operationsInBatch++;
          successfulImports++;

          if (operationsInBatch >= 499) { 
            await batch.commit();
            batch = db.batch(); // Compat style
            operationsInBatch = 0;
            setStatusMessage(`${successfulImports} / ${jsonRows.length}개 샵 처리 완료... 계속 진행 중...`);
          }
        }

        if (operationsInBatch > 0) {
          await batch.commit(); 
        }

        setStatusMessage(
          `가져오기 완료! 총 ${jsonRows.length}개 행 중 ${successfulImports}개 샵 정보가 성공적으로 등록되었습니다.` +
          (currentErrorDetails.length > 0 ? ` (${currentErrorDetails.length}개 행에서 오류/경고 발생)` : '')
        );
        setErrorDetails(currentErrorDetails);
        if (successfulImports > 0) {
          onImportSuccess(); 
        }

      } catch (err: any) {
        console.error("Import error:", err);
        setStatusMessage(`오류 발생: ${err.message || '알 수 없는 오류가 발생했습니다. 콘솔을 확인해주세요.'}`);
        setErrorDetails(prev => [...prev, `전체 가져오기 과정에서 심각한 오류 발생: ${err.message}`]);
      } finally {
        setIsImporting(false);
        const fileInput = document.getElementById('bulk-import-file') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
        setSelectedFile(null); 
      }
    };

    reader.onerror = () => {
      setStatusMessage('오류: 파일을 읽는 데 실패했습니다.');
      setIsImporting(false);
      setSelectedFile(null);
    };
    reader.readAsBinaryString(selectedFile);
  }, [selectedFile, onImportSuccess, parseDetailedServices]);

  const Instructions = () => (
    <div className="mt-4 p-4 bg-pink-50 border border-pink-200 rounded-lg text-sm text-slate-700 shadow">
      <h4 className="font-semibold text-pink-700 mb-2 text-base">
        <i className="fas fa-info-circle mr-2"></i>Excel/CSV 파일 형식 안내
      </h4>
      <p className="mb-2">파일의 첫 번째 행은 헤더(제목 줄)여야 합니다. 다음은 권장 컬럼명과 설명입니다:</p>
      <ul className="list-disc list-inside space-y-1.5 pl-4 text-slate-600">
        <li><strong>name</strong> (필수): 샵 이름 (텍스트)</li>
        <li><strong>description</strong> (필수): 샵 설명 (텍스트)</li>
        <li><strong>address</strong> (필수): 주소 (텍스트)</li>
        <li><strong>imageUrl</strong>: 이미지 URL (텍스트, 비어있을 경우 기본 이미지 사용)</li>
        <li><strong>rating</strong>: 평점 (숫자, 0-5 사이. 비어있거나 잘못된 경우 0으로 처리. 리뷰에 의해 갱신될 수 있음)</li>
        <li><strong>reviewCount</strong>: 리뷰 수 (숫자. 비어있거나 잘못된 경우 0으로 처리. 리뷰에 의해 갱신됨)</li>
        <li><strong>servicesPreview</strong>: 주요 서비스 (쉼표로 구분된 텍스트, 예: <code>타이 마사지,아로마 테라피</code>)</li>
        <li><strong>phoneNumber</strong>: 전화번호 (텍스트, 비어있을 경우 "정보 없음"으로 처리)</li>
        <li><strong>operatingHours</strong>: 운영 시간 (텍스트, 비어있을 경우 "정보 없음"으로 처리)</li>
        <li><strong>detailedServices</strong>: 상세 서비스 목록 (JSON 문자열 형식). 예:
          <pre className="bg-pink-100 p-2 rounded text-xs mt-1 overflow-x-auto"><code>{'[{"name":"발 마사지","price":"₩30,000"},{"name":"전신 마사지","price":"₩60,000"}]'}</code></pre>
        </li>
      </ul>
      <p className="mt-3 text-xs text-slate-500">
        * 필수 컬럼이 누락되거나 데이터 형식이 크게 잘못된 경우, 해당 행은 건너뛸 수 있습니다.<br/>
        * CSV 파일은 UTF-8 인코딩을 권장합니다.
      </p>
    </div>
  );

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg border border-pink-100">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-pink-700">
          <i className="fas fa-file-upload mr-2 text-pink-500"></i>샵 정보 대량 등록 (Excel/CSV)
        </h3>
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="text-sm text-pink-600 hover:text-pink-700 font-medium flex items-center"
          aria-expanded={showInstructions}
        >
          {showInstructions ? (
            <> <i className="fas fa-chevron-up mr-1"></i>안내 숨기기</>
          ) : (
            <> <i className="fas fa-chevron-down mr-1"></i>파일 형식 안내 보기</>
          )}
        </button>
      </div>

      {showInstructions && <Instructions />}

      <div className="mt-4 space-y-4">
        <div>
          <label htmlFor="bulk-import-file" className="block text-sm font-medium text-slate-700 mb-1">
            파일 선택 (.xlsx, .xls, .csv)
          </label>
          <input
            id="bulk-import-file"
            type="file"
            accept=".xlsx, .xls, .csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-pink-100 file:text-pink-700 hover:file:bg-pink-200 transition-colors disabled:opacity-50"
            disabled={isImporting}
            aria-describedby="file-status-message"
          />
        </div>

        <button
          onClick={handleImport}
          disabled={!selectedFile || isImporting}
          className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-75 transition-all duration-150 ease-in-out disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isImporting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              가져오는 중...
            </>
          ) : (
            <><i className="fas fa-check-circle mr-2"></i>선택한 파일 가져오기</>
          )}
        </button>
      </div>

      {statusMessage && (
        <p 
           id="file-status-message" 
           className={`mt-4 text-sm ${errorDetails.length > 0 && statusMessage.includes('오류') ? 'text-red-600' : 'text-slate-600'} p-3 rounded-md ${errorDetails.length > 0 && statusMessage.includes('오류') ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}
           role="alert"
        >
          {statusMessage}
        </p>
      )}

      {errorDetails.length > 0 && (
        <div className="mt-4 space-y-1">
          <h4 className="text-sm font-semibold text-red-700">오류/경고 상세 정보:</h4>
          <ul className="list-disc list-inside pl-4 text-xs text-red-600 max-h-48 overflow-y-auto bg-red-50 p-3 rounded-md border border-red-200">
            {errorDetails.map((detail, index) => (
              <li key={index}>{detail}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default BulkImport;