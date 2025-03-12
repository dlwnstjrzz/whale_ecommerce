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
    // 직접 호출이 실패하면 서버 API 호출
    console.log("직접 API 호출 실패, 서버 API 사용");
    const serverResponse = await fetch("/api/crawl-pandarank-keywords", {
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
    console.log("relatedKeywords", relatedKeywords);
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
