
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth'; // Import auth module
import { MassageShop, Service, Review, ShopInquiry, ShopInquiryStatus } from './types';

// Firebase configuration provided by the user
const firebaseConfig = {
  apiKey: "AIzaSyCdMZjAU1eMaPZQzeHe6woq1ytwLChi72E",
  authDomain: "massagefinder-d064b.firebaseapp.com",
  projectId: "massagefinder-d064b",
  storageBucket: "massagefinder-d064b.firebasestorage.app",
  messagingSenderId: "750583340559",
  appId: "1:750583340559:web:3e92f290fdcd41f6ba8d7a",
  measurementId: "G-G2FELZN0WN"
};

type FirebaseApp = firebase.app.App;

let app: FirebaseApp;
if (!firebase.apps.length) {
  app = firebase.initializeApp(firebaseConfig);
} else {
  app = firebase.app();
}

const db: firebase.firestore.Firestore = firebase.firestore(app);
const auth: firebase.auth.Auth = firebase.auth(app);

export const fetchShopsFromFirestore = async (): Promise<MassageShop[]> => {
  const shopsCollectionRef = db.collection('shops');
  try {
    const querySnapshot = await shopsCollectionRef.get();
    const shops: MassageShop[] = [];
    
    querySnapshot.forEach((documentSnapshot: firebase.firestore.QueryDocumentSnapshot<firebase.firestore.DocumentData>) => {
      const data = documentSnapshot.data();
      
      let processedDetailedServices: Service[] = [];
      const dsData = data.detailedServices;

      if (Array.isArray(dsData)) {
        processedDetailedServices = dsData.map((s: any) => ({
          name: s.name || '',
          price: s.price || ''
        })).filter(s => s.name || s.price);
      } else if (dsData && typeof dsData === 'object' && dsData !== null) {
        // Handle single object case if necessary, or log warning
      }


      shops.push({
        id: documentSnapshot.id,
        name: data.name || '이름 없음',
        description: data.description || '설명 없음',
        imageUrl: data.imageUrl || 'https://picsum.photos/seed/placeholder/600/400',
        address: data.address || '주소 없음',
        rating: typeof data.rating === 'number' ? data.rating : 0,
        reviewCount: typeof data.reviewCount === 'number' ? data.reviewCount : 0,
        viewCount: typeof data.viewCount === 'number' ? data.viewCount : 0,
        servicesPreview: Array.isArray(data.servicesPreview) ? data.servicesPreview.filter(sp => typeof sp === 'string') : [],
        phoneNumber: data.phoneNumber || '연락처 없음',
        operatingHours: data.operatingHours || '운영 시간 정보 없음',
        detailedServices: processedDetailedServices,
        isRecommended: typeof data.isRecommended === 'boolean' ? data.isRecommended : false, // Fetch isRecommended
      });
    });
    return shops;
  } catch (error: any) {
    console.error("Error fetching shops from Firestore: ", error?.message || String(error));
    if (error.code === 'unavailable' || error.message.includes('Firestore backend is not available.')) {
        throw new Error('Firebase Firestore service is unavailable. Check network connection and Firebase status.');
    }
    throw error; 
  }
};

export const addShopToFirestore = async (shopData: Omit<MassageShop, 'id'>): Promise<string> => {
  try {
    const docRef = await db.collection('shops').add({
      ...shopData,
      rating: shopData.rating || 0, 
      reviewCount: shopData.reviewCount || 0,
      viewCount: shopData.viewCount || 0,
      isRecommended: shopData.isRecommended || false, // Add isRecommended
    });
    return docRef.id;
  } catch (error: any) {
    console.error("Error adding shop to Firestore: ", error?.message || String(error));
    throw new Error(`샵 정보 추가 중 오류 발생: ${error.message}`);
  }
};

export const updateShopInFirestore = async (shopId: string, shopData: Omit<MassageShop, 'id'>): Promise<void> => {
  try {
    const shopRef = db.collection('shops').doc(shopId);
    await shopRef.update({
        ...shopData,
        isRecommended: shopData.isRecommended || false, // Update isRecommended
    });
  } catch (error: any) {
    console.error(`Error updating shop ${shopId} in Firestore: `, error?.message || String(error));
    throw new Error(`샵 정보 업데이트 중 오류 발생: ${error.message}`);
  }
};

export const deleteShopFromFirestore = async (shopId: string): Promise<void> => {
  try {
    const shopRef = db.collection('shops').doc(shopId);
    await shopRef.delete();
    // Consider deleting subcollections like reviews if necessary, typically done with Firebase Functions.
  } catch (error: any) {
    console.error(`Error deleting shop ${shopId} in Firestore: `, error?.message || String(error));
    throw new Error(`샵 정보 삭제 중 오류 발생: ${error.message}`);
  }
};

export const incrementShopViewCount = async (shopId: string): Promise<void> => {
  const shopRef = db.collection('shops').doc(shopId);
  try {
    // Atomically increment the view count.
    await shopRef.update({
      viewCount: firebase.firestore.FieldValue.increment(1)
    });
  } catch (error: any) {
    // This action is non-critical for the user experience, so we can fail silently.
    // However, we should log the error for debugging purposes.
    console.warn(`Could not increment view count for shop ${shopId}:`, error.message);
  }
};


// --- Review Functions ---

export const addReviewToShop = async (
  shopId: string, 
  reviewData: Omit<Review, 'id' | 'shopId' | 'createdAt'>
): Promise<{ reviewId: string; newAverageRating: number; newReviewCount: number }> => {
  const shopRef = db.collection('shops').doc(shopId);
  const reviewsRef = shopRef.collection('reviews');

  try {
    let newAverageRating = 0;
    let newReviewCount = 0;

    const newReviewRef = await db.runTransaction(async (transaction) => {
      const shopDoc = await transaction.get(shopRef);
      if (!shopDoc.exists) {
        throw new Error("샵을 찾을 수 없습니다.");
      }

      const shopData = shopDoc.data() as MassageShop;
      
      const reviewFullData = {
        ...reviewData,
        shopId: shopId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp() as firebase.firestore.Timestamp,
      };
      const tempReviewRef = reviewsRef.doc(); 
      transaction.set(tempReviewRef, reviewFullData);
      
      const currentTotalRating = (shopData.rating || 0) * (shopData.reviewCount || 0);
      newReviewCount = (shopData.reviewCount || 0) + 1;
      const newTotalRating = currentTotalRating + reviewData.rating;
      newAverageRating = newTotalRating / newReviewCount;
      
      newAverageRating = Math.max(0, Math.min(5, parseFloat(newAverageRating.toFixed(1))));

      transaction.update(shopRef, {
        rating: newAverageRating,
        reviewCount: newReviewCount,
      });
      
      return tempReviewRef.id;
    });
    
    return { reviewId: newReviewRef, newAverageRating, newReviewCount };

  } catch (error: any) {
    console.error("Error adding review to Firestore: ", error?.message || String(error));
    throw new Error(`리뷰 추가 중 오류 발생: ${error.message}`);
  }
};


export const fetchReviewsForShop = async (shopId: string): Promise<Review[]> => {
  const reviewsCollectionRef = db.collection('shops').doc(shopId).collection('reviews').orderBy('createdAt', 'desc');
  try {
    const querySnapshot = await reviewsCollectionRef.get();
    const reviews: Review[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      reviews.push({
        id: doc.id,
        shopId: data.shopId,
        authorName: data.authorName || "익명",
        rating: typeof data.rating === 'number' ? Math.max(1, Math.min(5, data.rating)) : 3,
        comment: data.comment || "",
        createdAt: data.createdAt || firebase.firestore.Timestamp.now(),
      });
    });
    return reviews;
  } catch (error: any) {
    console.error(`Error fetching reviews for shop ${shopId}: `, error?.message || String(error));
    throw new Error(`샵 리뷰를 불러오는 중 오류 발생: ${error.message}`);
  }
};

// --- Shop Inquiry Functions ---
export const addShopInquiryToFirestore = async (
  inquiryData: Omit<ShopInquiry, 'id' | 'createdAt' | 'status'>
): Promise<string> => {
  try {
    const docRef = await db.collection('shopInquiries').add({
      ...inquiryData,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      status: 'new' as ShopInquiryStatus,
    });
    return docRef.id;
  } catch (error: any) {
    console.error("Error adding shop inquiry to Firestore: ", error?.message || String(error));
    throw new Error(`샵 입점 문의 제출 중 오류 발생: ${error.message}`);
  }
};

export const fetchShopInquiriesFromFirestore = async (): Promise<ShopInquiry[]> => {
  const inquiriesCollectionRef = db.collection('shopInquiries').orderBy('createdAt', 'desc');
  try {
    const querySnapshot = await inquiriesCollectionRef.get();
    const inquiries: ShopInquiry[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      inquiries.push({
        id: doc.id,
        ownerName: data.ownerName || '',
        contactNumber: data.contactNumber || '',
        email: data.email || '',
        shopName: data.shopName || '',
        shopLocation: data.shopLocation || '',
        inquiryDetails: data.inquiryDetails || '',
        createdAt: data.createdAt || firebase.firestore.Timestamp.now(),
        status: data.status || 'new',
      } as ShopInquiry);
    });
    return inquiries;
  } catch (error: any) {
    console.error("Error fetching shop inquiries from Firestore: ", error?.message || String(error));
    throw new Error(`샵 입점 문의 목록을 불러오는 중 오류 발생: ${error.message}`);
  }
};

export const updateShopInquiryStatusInFirestore = async (
  inquiryId: string,
  status: ShopInquiryStatus
): Promise<void> => {
  try {
    const inquiryRef = db.collection('shopInquiries').doc(inquiryId);
    await inquiryRef.update({ status });
  } catch (error: any) {
    console.error(`Error updating shop inquiry ${inquiryId} status: `, error?.message || String(error));
    throw new Error(`입점 문의 상태 업데이트 중 오류 발생: ${error.message}`);
  }
};

export const deleteShopInquiryFromFirestore = async (inquiryId: string): Promise<void> => {
  try {
    const inquiryRef = db.collection('shopInquiries').doc(inquiryId);
    await inquiryRef.delete();
  } catch (error: any) {
    console.error(`Error deleting shop inquiry ${inquiryId}: `, error?.message || String(error));
    throw new Error(`입점 문의 삭제 중 오류 발생: ${error.message}`);
  }
};

// --- Auth Functions ---
export const signInAdmin = (email: string, password: string): Promise<firebase.auth.UserCredential> => {
  return auth.signInWithEmailAndPassword(email, password);
};

export const signOutAdmin = (): Promise<void> => {
  return auth.signOut();
};

export const onAuthChange = (callback: (user: firebase.User | null) => void) => {
  return auth.onAuthStateChanged(callback);
};

export { db, app, auth };