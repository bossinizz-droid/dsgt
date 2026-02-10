import { GoogleGenAI, Type } from "@google/genai";

// Use process.env.API_KEY directly as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeItem = async (imageB64: string, textDescription: string) => {
  const model = 'gemini-3-flash-preview';
  
  const prompt = `이 중고 거래 물품을 분석해주세요. 
  사용자 설명: ${textDescription}
  
  다음 정보를 한국어로 식별해주세요:
  1. 가장 잘 맞는 카테고리 (전자제품, 가구/인테리어, 의류/잡화, 도서/취미, 캠핑/레저, 재능기부 중 하나)
  2. 제안 상태 (S급 (미개봉/새상품), A급 (사용감 적음), B급 (사용감 있음), C급 (기능 이상 없음) 중 하나)
  3. 적정 판매가 (사내 포인트 단위, 1,000 ~ 500,000 사이)
  4. 물건을 잘 나타내는 한글 상품명.`;

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { inlineData: { data: imageB64, mimeType: 'image/jpeg' } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          condition: { type: Type.STRING },
          suggestedPrice: { type: Type.NUMBER },
          title: { type: Type.STRING },
          analysisSummary: { type: Type.STRING }
        },
        required: ["category", "condition", "suggestedPrice", "title"]
      }
    }
  });

  // Use the .text property to access the response content.
  return JSON.parse(response.text?.trim() || '{}');
};
