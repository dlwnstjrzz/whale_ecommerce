import { NextResponse } from "next/server";

/**
 * 상품명을 단어별로 분리하여 각 단어에 대해 상표 검색을 수행하는 함수
 * @param {string} productName - 검색할 상품명
 * @returns {Promise<Object>} - 검색 결과
 */
async function checkProductName(productName) {
  try {
    // 상품명이 비어있으면 빈 결과 반환
    if (!productName || productName.trim() === "") {
      return { words: [], results: {} };
    }

    // 상품명을 단어별로 분리
    const words = productName
      .split(/\s+/)
      .filter((word) => word.trim() !== "")
      .map((word) => word.trim());

    // 각 단어에 대해 상표 검색 수행
    const results = {};
    for (const word of words) {
      // 2글자 미만인 단어는 검색하지 않음
      if (word.length < 2) {
        results[word] = {
          isChecked: true,
          isTrademark: false,
          message: "2글자 미만으로 검색하지 않음",
          data: { totalCount: 0, items: [] },
        };
        continue;
      }

      // 상표 검색 API 호출
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || ""
        }/api/check-trademark?keyword=${encodeURIComponent(word)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status}`);
      }

      const data = await response.json();
      // 검색 결과 처리
      results[word] = {
        isChecked: true,
        isTrademark: data.totalCount > 0,
        similarity:
          data.items[0].title === word
            ? 1
            : data.items[0].title.includes(word)
            ? 0.5
            : 0,
        message:
          data.totalCount > 0
            ? `${data.totalCount}개의 상표가 발견되었습니다.`
            : "상표가 발견되지 않았습니다.",
        data,
      };
    }

    return {
      words,
      results,
    };
  } catch (error) {
    console.error("상품명 검사 오류:", error);
    throw error;
  }
}

export async function POST(request) {
  try {
    const { productName } = await request.json();

    if (!productName) {
      return NextResponse.json(
        { error: "상품명이 필요합니다." },
        { status: 400 }
      );
    }

    const result = await checkProductName(productName);

    return NextResponse.json(result);
  } catch (error) {
    console.error("상품명 검사 API 오류:", error);
    return NextResponse.json(
      { error: `상품명 검사 중 오류가 발생했습니다: ${error.message}` },
      { status: 500 }
    );
  }
}
