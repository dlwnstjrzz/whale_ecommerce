import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: "이미지 URL이 필요합니다." },
        { status: 400 }
      );
    }

    const prompt = `다음 규칙에 따라 제품 이미지를 분석해주세요:

1. 제품 카테고리 분석:
   - 제품의 주요 카테고리를 한 단어로 명확하게 지정
   - 예: 의자, 바구니, 의류, 가방 등

2. 제품 특징 분석 (다음 8가지 카테고리별로 분석):
   a. 재질 특징:
      - 검색 가능한 구체적인 재질명 사용
   
   b. 모양 특징:
      - 검색 가능한 구체적인 형태명 사용
   
   c. 기능적 특징:
      - 검색 가능한 구체적인 기능명 사용
   
   d. 사용용도:
      - 구체적인 용도명 사용
   
   e. 사용자:
      - 구체적인 사용자 명칭 사용
   
   f. 사용장소:
      - 매우 구체적인 장소명 사용
   
   g. 제품 지칭어:
      - 검색 가능한 대체 지칭어 포함
   
   h. 기타 특징:
      - 반드시 이미지에 속한 텍스트로 추출

3. 주의사항:
   - 검색되지 않을 형용사 사용 금지 (예쁜, 귀여운, 부드러운 등)
   - 오타나 잘못된 표기 사용 금지
   - 구체적이고 검색 가능한 단어 사용
   - 이미지에 속한 텍스트 위주로 분석
   - 반드시 8가지 카테고리 모두를 추출할 필요 없음

4. 응답 형식:
   {
     "category": "제품 카테고리",
     "features": [
     "재질",
     "모양",
     "기능",
     "용도",
     "사용자",
     "장소",
     "지칭어",
     ]
   }
   
   features는 반드시 8가지 카테고리 모두를 추출할 필요 없음, 예를 들어 재질이 없다면 다른 키워드를 여러 개 넣어도됨.
   반드시 카테고리 당 하나의 키워드를 추출할 필요 없음.
   `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "당신은 제품 이미지를 분석하여 제품의 특징을 추출하는 전문가입니다.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 500,
    });

    const analysisResult = completion.choices[0].message.content;
    const match = analysisResult.match(/\{.*\}/s);
    let imageAnalysis = { features: [], category: "", searchKeywords: [] };

    if (match) {
      try {
        const jsonObj = JSON.parse(match[0]);
        imageAnalysis = {
          features: jsonObj.features || [],
          category: jsonObj.category || "",
          searchKeywords: jsonObj.searchKeywords || [],
        };
      } catch (e) {
        console.error("JSON 파싱 오류:", e);
      }
    }
    console.log(imageAnalysis);
    return NextResponse.json(imageAnalysis);
  } catch (error) {
    console.error("이미지 분석 오류:", error);
    return NextResponse.json(
      { error: "이미지 분석 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
