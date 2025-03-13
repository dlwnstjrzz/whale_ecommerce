import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    // 요청 본문에서 파라미터 추출
    const requestData = await request.json();

    // 필수 파라미터 확인
    const {
      cid = "50004828", // 기본값: 생활/건강 카테고리
      timeUnit = "date",
      startDate,
      endDate,
      age = "",
      gender = "",
      device = "",
      page = 1,
      count = 20,
    } = requestData;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "시작일과 종료일이 필요합니다." },
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

    // URLSearchParams 생성
    const params = new URLSearchParams();
    params.append("cid", cid);
    params.append("timeUnit", timeUnit);
    params.append("startDate", startDate);
    params.append("endDate", endDate);
    params.append("age", age);
    params.append("gender", gender);
    params.append("device", device);
    params.append("page", page);
    params.append("count", count);

    // 먼저 메인 페이지에 접속하여 쿠키 획득
    const mainPageUrl =
      "https://datalab.naver.com/shoppingInsight/sCategory.naver";
    const mainPageResponse = await fetch(mainPageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });

    // 쿠키 추출
    const cookies = mainPageResponse.headers.get("set-cookie");
    const cookieString = cookies || "";

    // 네이버 데이터랩 쇼핑인사이트 API 호출
    const response = await fetch(
      "https://datalab.naver.com/shoppingInsight/getCategoryKeywordRank.naver",
      {
        method: "POST",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept: "application/json, text/plain, */*",
          "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          Referer: "https://datalab.naver.com/shoppingInsight/sCategory.naver",
          Origin: "https://datalab.naver.com",
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          Cookie: cookieString,
          "sec-ch-ua":
            '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"macOS"',
          "Sec-Fetch-Dest": "empty",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Site": "same-origin",
        },
        body: params.toString(),
      }
    );

    if (!response.ok) {
      throw new Error(`네이버 데이터랩 API 응답 오류: ${response.status}`);
    }

    // 응답 데이터 가져오기
    const responseText = await response.text();

    // 응답이 JSON인지 확인
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      // JSON 파싱 실패 시 텍스트 그대로 반환
      responseData = { rawResponse: responseText };
    }

    // 응답 반환
    return NextResponse.json(
      {
        success: true,
        data: responseData,
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  } catch (error) {
    console.error("네이버 데이터랩 API 오류:", error);

    // 오류 발생 시 기본 데이터 반환
    return NextResponse.json(
      {
        error: `네이버 데이터랩 API 호출 중 오류가 발생했습니다: ${error.message}`,
        // 서버리스 환경에서 오류 발생 시 기본 데이터 제공
        defaultData: {
          keywords: [],
        },
      },
      {
        status: 200, // 클라이언트 측 오류 방지를 위해 200 반환
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  }
}

export function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }
  );
}
