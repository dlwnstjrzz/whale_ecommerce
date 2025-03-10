import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    // URL에서 키워드 파라미터 추출
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword");

    if (!keyword) {
      return NextResponse.json(
        { error: "키워드 파라미터가 필요합니다." },
        { status: 400 }
      );
    }

    // 키워드 인코딩
    const encodedKeyword = encodeURIComponent(keyword);

    // PandaRank API URL 생성
    const apiUrl = `https://pandarank.net/api/keywords/${encodedKeyword}/realtime/top80?type=18&keyword=${encodedKeyword}&withLimiter=false`;

    // API 요청
    const response = await fetch(apiUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept: "application/json",
        Referer: "https://pandarank.net/",
      },
    });

    if (!response.ok) {
      throw new Error(
        `API 요청 실패: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    // 응답 반환
    return NextResponse.json(data);
  } catch (error) {
    console.error("키워드 검색 중 오류 발생:", error);
    return NextResponse.json(
      { error: `키워드 검색 중 오류가 발생했습니다: ${error.message}` },
      { status: 500 }
    );
  }
}
