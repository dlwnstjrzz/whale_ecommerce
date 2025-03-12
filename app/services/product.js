export async function extractKeyword(productName) {
  const response = await fetch("/api/extract-keyword", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ productName }),
  });

  if (!response.ok) {
    throw new Error("키워드 추출 중 오류가 발생했습니다.");
  }

  return response.json();
}

export async function searchRelatedKeywords(keyword) {
  try {
    // 서버 API 대신 직접 PandaRank API 호출 시도
    const encodedKeyword = encodeURIComponent(keyword);
    const url = `https://pandarank.net/api/keywords/${encodedKeyword}/table?_=${Date.now()}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json",
        Referer: "https://pandarank.net/",
        Origin: "https://pandarank.net",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
      mode: "no-cors", // CORS 모드 설정
    });

    // 직접 호출이 성공하면 데이터 처리
    if (response.ok) {
      const data = await response.json();

      if (!data.data || !Array.isArray(data.data)) {
        throw new Error("API 응답이 올바른 형식이 아님");
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

      // 검색량이 40-1200 사이이고 쇼핑전환이 0보다 큰 키워드만 필터링
      const filteredData = rawData.filter((item) => {
        return (
          item.monthlySearchVolume >= 40 &&
          item.monthlySearchVolume <= 1200 &&
          item.shoppingConversion > 0
        );
      });

      return {
        relatedKeywords: filteredData.map((item) => item.keyword),
        rawData: filteredData,
      };
    }

    // 직접 호출이 실패하면 서버 API 호출
    console.log("직접 API 호출 실패, 서버 API 사용");
    const serverResponse = await fetch("/api/search-related-keywords", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ keyword }),
    });

    if (!serverResponse.ok) {
      throw new Error("연관 키워드 검색 중 오류가 발생했습니다.");
    }

    return serverResponse.json();
  } catch (error) {
    console.error("연관 키워드 검색 오류:", error);
    throw error;
  }
}

export async function analyzeImage(imageUrl) {
  const response = await fetch("/api/analyze-image", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ imageUrl }),
  });

  if (!response.ok) {
    throw new Error("이미지 분석 중 오류가 발생했습니다.");
  }

  return response.json();
}

export async function generateProductName(productName, imageUrl) {
  try {
    // 1. 키워드 추출
    const { keyword: mainKeyword } = await extractKeyword(productName);
    console.log("mainKeyword", mainKeyword);
    // 2. 연관 키워드 검색
    const { relatedKeywords, rawData } = await searchRelatedKeywords(
      mainKeyword
    );
    // 3. 이미지 분석
    const imageAnalysis = await analyzeImage(imageUrl);
    console.log("imageAnalysis", imageAnalysis);
    // 4. 키워드 선택 및 제품명 생성
    const response = await fetch("/api/generate-product-name", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productName,
        imageUrl,
        mainKeyword,
        relatedKeywords,
        rawData,
        imageAnalysis,
      }),
    });

    if (!response.ok) {
      throw new Error("제품명 생성 중 오류가 발생했습니다.");
    }

    return response.json();
  } catch (error) {
    console.error("제품명 생성 오류:", error);
    throw error;
  }
}

export function generateExcelFile(result) {
  if (!result) return;

  const worksheet = XLSX.utils.json_to_sheet([
    {
      "원본 제품명": result.originalProductName,
      "메인 키워드": result.mainKeyword,
      "제품 카테고리": result.imageCategory,
      "이미지 특징": result.imageFeatures.join(", "),
      "이미지 검색 키워드": result.imageSearchKeywords.join(", "),
      "선택된 키워드": result.selectedKeywords.join(", "),
      "생성된 제품명 1": result.generatedProductNames[0] || "",
      "생성된 제품명 2": result.generatedProductNames[1] || "",
      "생성된 제품명 3": result.generatedProductNames[2] || "",
      "생성된 제품명 4": result.generatedProductNames[3] || "",
      "생성된 제품명 5": result.generatedProductNames[4] || "",
    },
  ]);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "제품명 추천 결과");
  XLSX.writeFile(workbook, "제품명_추천_결과.xlsx");
}
