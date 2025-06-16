
import firebase from 'firebase/compat/app'; // Added import
import 'firebase/compat/firestore'; // Ensure firestore types are available

export interface Service {
  name: string;
  price: string;
}

export interface Review {
  id: string;
  shopId: string;
  authorName: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: firebase.firestore.Timestamp; 
}

export interface MassageShop {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  address: string;
  rating: number; // 이제 리뷰 기반 평균 별점, 0 to 5
  reviewCount: number; // 총 리뷰 수
  servicesPreview: string[]; // e.g., ["Thai Massage", "Aromatherapy"]
  phoneNumber: string;
  operatingHours: string;
  detailedServices: Service[];
  isRecommended?: boolean; // Added for recommended shops feature
}