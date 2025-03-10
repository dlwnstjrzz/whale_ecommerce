import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const { productName } = await request.json();

    if (!productName) {
      return NextResponse.json(
        { error: "제품명이 필요합니다." },
        { status: 400 }
      );
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            '당신은 제품명에서 가장 기본적인 검색 키워드를 추출하는 전문가입니다. 예를 들어 "라틴원형 에쁜 빨래 바구니"와 같은 제품명에서 "빨래바구니"와 같은 가장 보편적인 검색 키워드를 추출해주세요.',
        },
        {
          role: "user",
          content: `다음 제품명에서 가장 보편적인 검색 키워드를 추출해주세요. 단어 띄어쓰기 없이 하나로 합쳐서 반환해주세요. 예: 빨래바구니\n\n제품명: ${productName}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 50,
    });

    const extractedKeyword = response.choices[0].message.content.trim();

    return NextResponse.json({ keyword: extractedKeyword });
  } catch (error) {
    console.error("키워드 추출 오류:", error);
    return NextResponse.json(
      { error: "키워드 추출 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
