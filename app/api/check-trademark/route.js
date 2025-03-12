import { NextResponse } from "next/server";

// 키프리스 API 키
const KIPRIS_API_KEY = "BzG=eUoutR8UQsIQ0sm2vZYYh6K5hb6Ynh=wIS8f/tc=";

/**
 * 키프리스 API를 통해 상표명을 검색하는 함수
 * @param {string} keyword - 검색할 키워드
 * @returns {Promise<Object>} - 검색 결과
 */
async function searchTrademark(keyword) {
  try {
    // 키워드가 비어있으면 빈 결과 반환
    if (!keyword || keyword.trim() === "") {
      return { totalCount: 0, items: [] };
    }

    // 키프리스 상표 검색 API URL (정확한 파라미터로 수정)
    const url = `http://plus.kipris.or.kr/kipo-api/kipi/trademarkInfoSearchService/getWordSearch?searchString=${encodeURIComponent(
      keyword
    )}&searchRecentYear=0&ServiceKey=${encodeURIComponent(KIPRIS_API_KEY)}`;

    console.log("키프리스 API 요청 URL:", url);

    // API 요청
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/xml",
      },
    });

    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status}`);
    }

    // XML 응답을 텍스트로 변환
    const xmlText = await response.text();
    console.log("키프리스 API 응답:", xmlText);

    // XML 파싱 (간단한 방식으로 처리)
    // 응답 코드 확인
    const resultCode =
      xmlText.match(/<resultCode>(\d+)<\/resultCode>/)?.[1] || "";
    const resultMsg = xmlText.match(/<resultMsg>(.*?)<\/resultMsg>/)?.[1] || "";

    if (resultCode !== "00") {
      throw new Error(`API 응답 오류: ${resultCode} - ${resultMsg}`);
    }

    // 총 개수 추출
    const totalCount =
      xmlText.match(/<totalCount>(\d+)<\/totalCount>/)?.[1] || "0";

    // 아이템 추출 (간단한 정규식 방식)
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xmlText)) !== null) {
      const itemXml = match[1];

      // 필요한 정보 추출
      const applicationNumber =
        itemXml.match(/<applicationNumber>(.*?)<\/applicationNumber>/)?.[1] ||
        "";
      const applicationDate =
        itemXml.match(/<applicationDate>(.*?)<\/applicationDate>/)?.[1] || "";
      const title = itemXml.match(/<title>(.*?)<\/title>/)?.[1] || "";
      const applicantName =
        itemXml.match(/<applicantName>(.*?)<\/applicantName>/)?.[1] || "";
      const regPrivilegeName =
        itemXml.match(/<regPrivilegeName>(.*?)<\/regPrivilegeName>/)?.[1] || "";
      const publicationNumber =
        itemXml.match(/<publicationNumber>(.*?)<\/publicationNumber>/)?.[1] ||
        "";
      const publicationDate =
        itemXml.match(/<publicationDate>(.*?)<\/publicationDate>/)?.[1] || "";
      const registrationNumber =
        itemXml.match(/<registrationNumber>(.*?)<\/registrationNumber>/)?.[1] ||
        "";
      const registrationDate =
        itemXml.match(/<registrationDate>(.*?)<\/registrationDate>/)?.[1] || "";
      const viennaCode =
        itemXml.match(/<viennaCode>(.*?)<\/viennaCode>/)?.[1] || "";
      const applicationStatus =
        itemXml.match(/<applicationStatus>(.*?)<\/applicationStatus>/)?.[1] ||
        "";
      const drawing = itemXml.match(/<drawing>(.*?)<\/drawing>/)?.[1] || "";
      const bigDrawing =
        itemXml.match(/<bigDrawing>(.*?)<\/bigDrawing>/)?.[1] || "";

      items.push({
        applicationNumber,
        applicationDate,
        title,
        applicantName,
        regPrivilegeName,
        publicationNumber,
        publicationDate,
        registrationNumber,
        registrationDate,
        viennaCode,
        applicationStatus,
        drawing,
        bigDrawing,
      });
    }

    // 필요한 필드만 추출하고 거절 상태인 상표는 제외
    const processedItems = items
      .filter((item) => item.applicationStatus !== "거절")
      .map((item) => ({
        applicationNumber: item.applicationNumber || "",
        applicationDate: item.applicationDate || "",
        title: item.title || item.regPrivilegeName || "",
        applicantName: item.applicantName || "",
        registrationNumber: item.registrationNumber || "",
        registrationDate: item.registrationDate || "",
        applicationStatus: item.applicationStatus || "",
        drawing: item.drawing || "",
        bigDrawing: item.bigDrawing || "",
      }));

    return {
      totalCount: parseInt(totalCount, 10),
      items: processedItems,
    };
  } catch (error) {
    console.error("상표 검색 오류:", error);
    throw error;
  }
}

export async function POST(request) {
  try {
    const { keyword } = await request.json();

    if (!keyword) {
      return NextResponse.json(
        { error: "검색어가 필요합니다." },
        { status: 400 }
      );
    }

    const result = await searchTrademark(keyword);

    return NextResponse.json(result);
  } catch (error) {
    console.error("상표 검색 API 오류:", error);
    return NextResponse.json(
      { error: `상표 검색 중 오류가 발생했습니다: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    // URL에서 키워드 파라미터 추출
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword");

    if (!keyword) {
      return NextResponse.json(
        { error: "검색어 파라미터가 필요합니다." },
        { status: 400 }
      );
    }

    const result = await searchTrademark(keyword);

    return NextResponse.json(result);
  } catch (error) {
    console.error("상표 검색 API 오류:", error);
    return NextResponse.json(
      { error: `상표 검색 중 오류가 발생했습니다: ${error.message}` },
      { status: 500 }
    );
  }
}
