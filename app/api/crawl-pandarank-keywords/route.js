import { NextResponse } from "next/server";
import puppeteerCore from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import * as cheerio from "cheerio";

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

    // 판다랭크 URL 생성
    const encodedKeyword = encodeURIComponent(keyword);
    const url = `https://pandarank.net/search/detail?keyword=${encodedKeyword}`;

    // 브라우저 실행
    const executablePath =
      process.env.NODE_ENV === "production"
        ? await chromium.executablePath()
        : process.platform === "win32"
        ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
        : process.platform === "darwin"
        ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
        : "/usr/bin/google-chrome";

    // const browser = await puppeteerCore.launch({
    //   headless: chromium.headless,
    //   args: [
    //     "--no-sandbox",
    //     "--disable-setuid-sandbox",
    //     "--disable-web-security",
    //     "--disable-features=IsolateOrigins,site-per-process",
    //     "--disable-dev-shm-usage",
    //     "--disable-gpu",
    //     "--disable-extensions",
    //   ],
    //   executablePath,
    //   // args: chromium.args,
    //   // defaultViewport: chromium.defaultViewport,

    //   ignoreHTTPSErrors: true,
    // });
    const launchOptions =
      process.env.NODE_ENV === "production"
        ? {
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath,
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
          }
        : {
            executablePath, // 위에서 설정한 로컬 Chrome 경로
            headless: true,
            ignoreHTTPSErrors: true,
            args: [
              "--no-sandbox",
              "--disable-setuid-sandbox",
              "--disable-web-security",
              "--disable-features=IsolateOrigins,site-per-process",
              "--disable-dev-shm-usage",
              "--disable-gpu",
              "--disable-extensions",
            ],
            // 필요한 경우 기본 args를 추가할 수 있음
          };

    const browser = await puppeteerCore.launch(launchOptions);
    try {
      const page = await browser.newPage();
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
      );
      // 페이지 로드
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await page.waitForSelector("#datatable", { timeout: 10000 }); // 최대 10초 대기

      // 페이지 로딩 후 2초 대기
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // HTML 가져오기
      const content = await page.content();

      // Cheerio로 HTML 파싱
      const $ = cheerio.load(content);

      // 연관 키워드 데이터 추출
      const rawData = [];

      // datatable ID를 가진 테이블에서 데이터 추출
      $("#datatable tbody tr").each((index, element) => {
        try {
          // 키워드 추출 - 첫번째 td 안의 keyword-search 클래스를 가진 span 태그
          const keywordText = $(element)
            .find("td:first-child .keyword-search")
            .text()
            .trim();

          // 월 검색량 추출 - 두번째 td
          const monthlySearchVolumeText = $(element)
            .find("td:nth-child(2)")
            .text()
            .replace(/,/g, "")
            .trim();
          const monthlySearchVolume = parseInt(monthlySearchVolumeText) || 0;

          // 경쟁률 추출 - 세번째 td 안의 첫번째 span
          const competitionRateText = $(element)
            .find("td:nth-child(3) span:first-child")
            .text()
            .trim();
          const competitionRate = parseFloat(competitionRateText) || 0;

          // 데이터가 유효한 경우에만 추가
          if (keywordText) {
            rawData.push({
              keyword: keywordText,
              monthlySearchVolume,
              competitionRate,
            });
          }
        } catch (err) {
          console.error(`행 ${index + 1} 처리 중 오류:`, err.message);
        }
      });

      // 검색량이 40-1200 사이인 키워드만 필터링
      const filteredData = rawData.filter((item) => {
        return (
          item.monthlySearchVolume >= 40 && item.monthlySearchVolume <= 1200
        );
      });
      console.log(rawData.length);
      return NextResponse.json(
        {
          relatedKeywords: filteredData.map((item) => item.keyword),
          rawData: rawData,
        },
        {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        }
      );
    } finally {
      // 브라우저 종료
      await browser.close();
    }
  } catch (error) {
    console.error("연관 검색어 크롤링 오류:", error);
    return NextResponse.json(
      {
        error: `연관 검색어 크롤링 중 오류가 발생했습니다: ${error.message}`,
      },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  }
}
