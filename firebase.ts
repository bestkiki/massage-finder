
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { MassageShop, Service, Review } from './types';

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
        servicesPreview: Array.isArray(data.servicesPreview) ? data.servicesPreview.filter(sp => typeof sp === 'string') : [],
        phoneNumber: data.phoneNumber || '연락처 없음',
        operatingHours: data.operatingHours || '운영 시간 정보 없음',
        detailedServices: processedDetailedServices,
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
      rating: shopData.rating || 0, // Ensure initial rating is set
      reviewCount: shopData.reviewCount || 0, // Ensure initial reviewCount is set
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
    // When updating, we might not want to overwrite reviewCount and average rating if they are managed by reviews.
    // However, if the admin form allows editing 'rating', it implies they can set a base rating.
    // For now, let's assume the form data is the source of truth for all fields it contains.
    await shopRef.update(shopData);
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
      
      // Add the new review
      const reviewFullData = {
        ...reviewData,
        shopId: shopId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp() as firebase.firestore.Timestamp,
      };
      const tempReviewRef = reviewsRef.doc(); // Create a ref for the new review
      transaction.set(tempReviewRef, reviewFullData);


      // Calculate new average rating and review count
      // This is a simplified way. For very high traffic, reading all reviews per new review might be slow.
      // A more scalable approach would be to increment a totalRatingSum and reviewCount.
      // For this example, we'll fetch all reviews within the transaction for recalculation.
      // However, fetching all reviews *within* a transaction for calculation can be tricky
      // if the number of reviews is large, as transactions have limits.
      // A more robust way to update aggregates is often using Firebase Cloud Functions.

      // For client-side transaction:
      // We assume `shopData.rating` holds the sum of all ratings and `shopData.reviewCount` holds the count.
      // This is not what we have now. `rating` is average.
      // Let's adjust: we'll fetch all reviews and recalculate.
      // This part is complex to do correctly and performantly on the client in a transaction without dedicated sum fields.
      // For now, let's simulate updating based on existing data and new review:
      
      const currentTotalRating = (shopData.rating || 0) * (shopData.reviewCount || 0);
      newReviewCount = (shopData.reviewCount || 0) + 1;
      const newTotalRating = currentTotalRating + reviewData.rating;
      newAverageRating = newTotalRating / newReviewCount;
      
      // Ensure rating is within 0-5 and has one decimal place
      newAverageRating = Math.max(0, Math.min(5, parseFloat(newAverageRating.toFixed(1))));


      transaction.update(shopRef, {
        rating: newAverageRating,
        reviewCount: newReviewCount,
      });
      
      return tempReviewRef.id; // Return the ID of the newly created review document
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
        createdAt: data.createdAt || firebase.firestore.Timestamp.now(), // Fallback if timestamp is missing
      });
    });
    return reviews;
  } catch (error: any) {
    console.error(`Error fetching reviews for shop ${shopId}: `, error?.message || String(error));
    throw new Error(`샵 리뷰를 불러오는 중 오류 발생: ${error.message}`);
  }
};


export { db, app };
