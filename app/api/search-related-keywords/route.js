import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { keyword } = await request.json();

    if (!keyword) {
      return NextResponse.json(
        { error: "키워드가 필요합니다." },
        {
          status: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        }
      );
    }

    // URL 인코딩된 키워드로 API 요청
    const encodedKeyword = encodeURIComponent(keyword);
    const url = `https://pandarank.net/api/keywords/${encodedKeyword}/table?_=${Date.now()}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json",
        Referer: "https://pandarank.net/",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "sec-ch-ua":
          '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status}`);
    }

    const data = await response.json();

    // 응답 데이터가 배열이 아닌 경우 처리
    if (!data.data || !Array.isArray(data.data)) {
      console.error("API 응답이 올바른 형식이 아님:", data);
      return NextResponse.json(
        {
          relatedKeywords: [],
          rawData: [],
        },
        {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        }
      );
    }

    // 응답 데이터 처리
    const rawData = data.data.map((item) => ({
      keyword: item[0], // 제품이름
      source: item[1], // 출처
      category: item[2], // 카테고리
      monthlySearchVolume: parseInt(item[3].replace(/,/g, "") || 0), // 월간 검색량
      productCount: parseInt(item[4].replace(/,/g, "") || 0), // 상품수
      competitionRate: parseFloat(item[5].replace(/,/g, "") || 0), // 경쟁률
      shoppingConversion: parseFloat(item[6].replace(/,/g, "") || 0), // 쇼핑전환
    }));

    // 검색량이 400-1200 사이이고 쇼핑전환이 0보다 큰 키워드만 필터링
    const filteredData = rawData.filter((item) => {
      return (
        item.monthlySearchVolume >= 40 &&
        item.monthlySearchVolume <= 1200 &&
        item.shoppingConversion > 0
      );
    });

    console.log("filteredData", filteredData);
    return NextResponse.json({
      relatedKeywords: filteredData.map((item) => item.keyword),
      rawData: filteredData,
    });
  } catch (error) {
    console.error("연관 검색어 API 오류:", error);
    return NextResponse.json(
      { error: `연관 검색어 조회 중 오류가 발생했습니다: ${error.message}` },
      { status: 500 }
    );
  }
}
