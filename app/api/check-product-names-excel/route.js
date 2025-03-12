import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

/**
 * 엑셀 파일에서 상품명을 추출하여 각 상품명에 대해 상표 검색을 수행하는 함수
 * @param {Buffer} fileBuffer - 엑셀 파일 버퍼
 * @returns {Promise<Object>} - 검색 결과
 */
async function checkProductNamesFromExcel(fileBuffer) {
  try {
    // 엑셀 파일 파싱
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    // 상품명 추출
    const productNames = jsonData
      .map((row) => {
        // 상품명 열 이름이 "상품명"인 경우
        if (row["상품명"]) {
          return row["상품명"];
        }
        // 상품명 열 이름이 "제품명"인 경우
        if (row["제품명"]) {
          return row["제품명"];
        }
        // 상품명 열 이름이 "품명"인 경우
        if (row["품명"]) {
          return row["품명"];
        }
        // 첫 번째 열의 값을 사용
        const firstKey = Object.keys(row)[0];
        return row[firstKey];
      })
      .filter((name) => name && typeof name === "string");
    // 각 상품명에 대해 상표 검색 수행
    const results = [];
    let safeCount = 0;
    let cautionCount = 0;

    for (const productName of productNames) {
      // 상품명 검사 API 호출
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/check-product-name`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ productName }),
        }
      );

      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status}`);
      }

      const data = await response.json();
      console.log("엑셀 검사 결과2", data);
      const result = data || {
        productName,
        isTrademark: false,
        wordResults: [],
      };

      // 결과 배열에 추가
      results.push(result);

      // 안전/주의 카운트 업데이트
      if (result.isTrademark) {
        cautionCount++;
      } else {
        safeCount++;
      }
    }

    return {
      data: {
        summary: {
          total: productNames.length,
          safe: safeCount,
          caution: cautionCount,
        },
        results: results,
      },
    };
  } catch (error) {
    console.error("엑셀 파일 처리 오류:", error);
    throw error;
  }
}

export async function POST(request) {
  try {
    // multipart/form-data 요청 처리
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        { error: "파일이 필요합니다." },
        { status: 400 }
      );
    }

    // 파일 버퍼로 변환
    const fileBuffer = await file.arrayBuffer();

    // 엑셀 파일 처리
    const result = await checkProductNamesFromExcel(fileBuffer);

    return NextResponse.json(result);
  } catch (error) {
    console.error("엑셀 파일 처리 API 오류:", error);
    return NextResponse.json(
      { error: `엑셀 파일 처리 중 오류가 발생했습니다: ${error.message}` },
      { status: 500 }
    );
  }
}
