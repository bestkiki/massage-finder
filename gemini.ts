import { GoogleGenAI, Type, GenerateContentResponse } from "https://esm.sh/@google/genai@0.16.0";
import { MassageShop, Review } from './types';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

const getFallbackReviews = (shop: MassageShop): Review[] => {
    const fallbackAuthors = ["김민준", "이서연", "박도윤", "최지우", "정시우", "강하준", "윤서아", "김도현"];
    const fallbackComments = [
        "분위기도 좋고 정말 시원했어요! 다음에 또 올게요.",
        "직원분들이 정말 친절하셔서 기분 좋게 받고 갑니다.",
        "시설이 깨끗해서 좋았습니다. 추천합니다.",
        "뭉친 곳을 정확히 풀어주셔서 몸이 가벼워졌어요. 최고!",
        "가격도 합리적이고 서비스도 만족스러웠습니다.",
        "몸이 찌뿌둥해서 방문했는데 만족스럽습니다.",
        "전반적으로 괜찮았어요. 재방문 의사 있습니다.",
        "최고의 경험이었습니다. 강력 추천!"
    ];
    
    const count = Math.max(1, Math.min(shop.reviewCount, 8));
    const reviews: Review[] = [];
    const usedAuthors = new Set();
    const usedComments = new Set();

    for(let i=0; i<count; i++) {
        const reviewDate = new Date();
        reviewDate.setDate(reviewDate.getDate() - (i * Math.floor(Math.random() * 5 + 2)));
        
        let author = fallbackAuthors[Math.floor(Math.random() * fallbackAuthors.length)];
        while (usedAuthors.has(author)) {
            author = fallbackAuthors[Math.floor(Math.random() * fallbackAuthors.length)];
        }
        usedAuthors.add(author);

        let comment = fallbackComments[Math.floor(Math.random() * fallbackComments.length)];
        while(usedComments.has(comment)) {
             comment = fallbackComments[Math.floor(Math.random() * fallbackComments.length)];
        }
        usedComments.add(comment);

        reviews.push({
            id: `fallback-${shop.id}-${i}`,
            shopId: shop.id,
            authorName: author,
            comment: comment,
            rating: Math.floor(Math.random() * 2) + 4, // 4 or 5
            createdAt: firebase.firestore.Timestamp.fromDate(reviewDate),
        });
    }
    return reviews;
};


export const generateDummyReviews = async (shop: MassageShop): Promise<Review[]> => {
  // Safely check for process and API_KEY to avoid ReferenceError in browser
  if (typeof process === 'undefined' || !process.env || !process.env.API_KEY) {
    console.warn("API_KEY is not set. Returning fallback dummy reviews.");
    return getFallbackReviews(shop);
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const reviewsToGenerate = Math.max(1, Math.min(shop.reviewCount, 15)); // Generate up to 15 reviews

  const prompt = `
    "${shop.name}" 라는 한국의 마사지 샵이 있습니다. 이 샵의 특징은 "${shop.description}" 입니다.
    이 샵에 대한 사실적인 가짜 리뷰를 ${reviewsToGenerate}개 생성해주세요.
    리뷰는 매우 사실적이어야 하며, 다양한 스타일(친절함, 시설, 효과, 가격 등)에 대한 긍정적인 평가와 가끔 중립적인 평가를 포함해야 합니다.
    평점(rating)은 3에서 5 사이의 정수여야 하고, 4점과 5점이 대부분이어야 합니다.
    작성자 이름(authorName)은 일반적인 한국인 이름이어야 합니다.
    각 리뷰는 authorName, rating (number), comment (string) 필드를 포함하는 JSON 객체여야 합니다.
    결과는 JSON 객체의 배열 형식으로만 응답해주세요. 다른 설명이나 마크다운은 포함하지 마세요.
  `;

  try {
    const responseSchema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          authorName: { type: Type.STRING },
          rating: { type: Type.INTEGER },
          comment: { type: Type.STRING },
        },
        required: ['authorName', 'rating', 'comment'],
      }
    };

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
      }
    });

    const jsonString = response.text.trim();
    const generatedData: { authorName: string; rating: number; comment: string }[] = JSON.parse(jsonString);

    const reviews: Review[] = generatedData.map((data, index) => {
      const reviewDate = new Date();
      reviewDate.setDate(reviewDate.getDate() - (index * Math.floor(Math.random() * 5 + 2))); // Stagger dates
      
      return {
        id: `fake-ai-${shop.id}-${index}`,
        shopId: shop.id,
        authorName: data.authorName,
        rating: Math.max(3, Math.min(5, data.rating)),
        comment: data.comment,
        createdAt: firebase.firestore.Timestamp.fromDate(reviewDate),
      };
    });

    return reviews;

  } catch (error) {
    console.error("Error generating reviews with Gemini:", error);
    return getFallbackReviews(shop);
  }
};