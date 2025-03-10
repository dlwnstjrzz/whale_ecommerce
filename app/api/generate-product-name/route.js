import OpenAI from "openai";
import { NextResponse } from "next/server";
// OpenAI API 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const {
      productName,
      mainKeyword,
      relatedKeywords,
      imageAnalysis,
      rawData,
      imageUrl,
    } = await request.json();

    if (!productName || !mainKeyword || !relatedKeywords || !imageAnalysis) {
      return NextResponse.json(
        { error: "필요한 데이터가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 2. 제품명 생성
    const prompt = `다음 규칙에 따라 상품명을 생성해주세요:

1. 상품명 구성 규칙:
   - 핵심메인키워드: 네이버 연관키워드 중에서 선택 (월 검색량 40~1200 사이)
   - 핵심메인키워드를 반드시 제품명 가장 앞에 배치할것
   - 메인키워드 1,2,3: 네이버 연관키워드 중에서 선택
   - 수식키워드 1,2: 이미지 분석 결과의 제품 특징에서 선택

2. 상품명 작성 규칙:
   - 총 길이: 70~80 byte
   - 같은 단어는 최대 2번까지만 사용 가능
   - 형용사는 제품의 특징을 나타내는 경우에만 사용
   - 제품의 사용용도/사용자/성별을 키워드로 포함 (선택사항)
   - 제품의 지칭 키워드는 2개 이상 포함

3. 제품 정보:
   - 원본 상품명: ${productName}
   - 이미지 분석 결과:
     * 제품 카테고리: ${imageAnalysis.category}
     * 제품 특징: ${imageAnalysis.features.join(", ")}
   - 네이버 연관키워드: ${relatedKeywords
     .map((k) => `${k.keyword}(${k.monthlySearchVolume}회)`)
     .join(", ")}

4. 주의사항:
   - 핵심메인키워드와 메인키워드는 반드시 네이버 연관키워드 중에서 선택
   - 수식키워드는 이미지 분석 결과의 제품 특징에서 선택
   - 검색되지 않을 단어 사용 금지
   - 꾸미는 형용사 최소화
   - 키워드 배치를 자연스럽게 구성

5. 상품명 구성 예시:

   예시 1: 검색 가능성 높은 키워드 조합
   원본: "선풍기 커버 덮개 스탠드 선풍기 보관망"
   → "대형 선풍기 커버 큰 덮개 스탠드 선풍기 보관망 보관용"

   예시 2: 제품 특징 중심
   원본: "빨래 바구니 뚜껑 있는 빨래통"
   → "긴 빨래 바구니 뚜껑 있는 빨래통 플라스틱 세탁물 바스켓"

   예시 3: 사용자 타겟팅
   원본: "목욕의자 어르신 욕실 낮은 의자"
   → "노인 목욕의자 어르신 욕실 낮은 의자 화장실 목욕탕"

   예시 4: 사용장소 타겟팅
   원본: "유치원 의자 어린이 미니 스툴"
   → "유치원 의자 어린이 미니 스툴 유아용 어린이집 책상"

   예시 5: 사용용도 타겟팅
   원본: "자전거용 장갑 미끄러지지않는 라이딩 장갑"
   → "자전거용 장갑 미끄러지지않는 라이딩 장갑 남성 여성"

   예시 6: 강아지 안전장치
   원본: "강아지 고양이 분리 안전망 가림막 팬스 애견 울타리"
   → "새끼 강아지 팬스 낮은 펫 울타리 휀스 칸막이 투명"

   예시 7: 여름용 마스크
   원본: "KC인증 이어홀 쿨마스크 여름 스포츠마스크 반사띠 쿨스카프 자전거 등산 골프머프"
   → "쿨마스크 안면 냉감 골프 여름 운동용 햇볕차단 등산용"

   예시 8: 라벨기
   원본: "가격 라벨기 스티커 핸드 롤텍기 8열 가격택 라벨지 잉크"
   → "가격 라벨기 기계 네임 스티커 출력기 이름 인쇄기 휴대용"

   예시 9: 휴대폰 거치대
   원본: "침대휴대폰거치대 누워서 핸드폰거치대 자바라거치대 테블릿 스탠딩거치대"
   → "침대 휴대폰 거치대 누워서보는 스마트폰 자바라 스탠드"

   예시 10: 청소 슬리퍼
   원본: "스마일 청소슬리퍼 바닥청소 실내화 극세사 청소화 거실바닥 주방물기 청소실내화"
   → "청소 슬리퍼 신발 걸레 극세사 발 바닥 청소 실내화"

   예시 11: 의자 팔걸이
   원본: "(단품)메모리폼 의자 팔쿠션 팔받침 팔걸이 보조 팔받침대 손목 쿠션 팔보조 메모리폼 사무용품"
   → "의자 팔걸이 쿠션 팔꿈치 손목 커버 팔쿠션 게이밍"

   예시 12: 나시티
   원본: "남자 나시 머슬 헬스 민소매 나시티 런닝 셔츠 레이어드 난닝구"
   → "남성 나시티 민소매 오버핏 기능성 여름 머슬핏 면나시"

   예시 13: 힙색
   원본: "스포츠힙색 운동 스마트폰 포켓벨트 방수 허리 힙쌕"
   → "스포츠 힙색 가방 허리 파우치 핸드폰 주머니 여행 남성"

   예시 14: 캐리어 커버
   원본: "테두리있는 투명 캐리어 커버 방수 덮개 20 22 24 26 28 30 인치"
   → "캐리어덮개 투명 여행용 가방 보호 항공커버 28 30인치"

   예시 15: 무릎 보호대
   원본: "X밴드 무릎보호대 슬개골 니슬리브 축구 러닝 관절"
   → "무릎 연골 보호대 헬스 배구 아대 런닝 슬개골 축구 슬리브"

   예시 16: 선정리
   원본: "무타공 케이블 선정리 스트랩 플러그걸이 코드걸이 전선걸이4p"
   → "무타공 걸이 코드 선 정리 벽걸이 후크 벽고리 4P"

   예시 17: 생리팬티
   원본: "하이웨이스트 전면 방수 생리팬티 위생팬티 샘방지 앞면 커버 순면 스판"
   → "하이웨이스트 여성 보정팬티 편한 생리위생 면 속옷"

   예시 18: 볼캡
   원본: "무지 매쉬 볼캡 모자 야구모자 캡모자 여름모자 등산모자 시원한모자 매시모자 메쉬모자"
   → "매쉬 볼캡 여름 시원한 쿨 야구 모자 메시캡 통풍 남성"

   예시 19: 드로즈
   원본: "여성 드로즈 팬티 속바지 여자 사각드로즈 치마속바지 보정팬티 똥배팬티 속반바지 하이웨이스트"
   → "여성 드로즈 팬티 사각 보정 심리스 속바지 와이존커버"

   예시 20: 발매트
   원본: "40x60 빨아쓰는 장모 발매트 대형 현관 욕실 화장실 발판 러그 매트 주방 미끄럼방지 발닦개"
   → "현관발판 매트 빨아쓰는 발 패드 주방바닥 물흡수 씽크대"

6. 잘못된 예시:
   ❌ "색상 블랙 청소솔 화장실 청소도구 욕실" (검색되지 않을 단어)
   ❌ "노인 목욕의자 사우나의자 화장실 욕실 낮은 의자" (같은 단어 3번 이상)
   ❌ "예쁜 머리핀 귀여운 어린이용 헤어핀 부드러운 천" (꾸미는 형용사 과다)

위 규칙에 따라 5개의 상품명을 생성해주세요. 각 상품명은 새로운 줄에 작성해주세요.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "당신은 제품 이름을 생성하는 전문가입니다.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const nameResult = completion.choices[0].message.content;
    console.log("nameResult", nameResult);

    // 줄바꿈으로 구분된 제품명들을 배열로 변환
    let generatedProductNames = nameResult
      .split("\n")
      .filter((name) => name.trim()) // 빈 줄 제거
      .map((name) => name.trim()); // 앞뒤 공백 제거

    // JSON 형식이 아닌 경우를 위한 처리
    if (generatedProductNames.length === 0) {
      try {
        const jsonObj = JSON.parse(nameResult);
        generatedProductNames = jsonObj.productNames || [];
      } catch (e) {
        console.error("JSON 파싱 오류:", e);
      }
    }

    return NextResponse.json({
      originalProductName: productName,
      mainKeyword,
      relatedKeywords,
      rawData,
      imageAnalysis: {
        category: imageAnalysis.category,
        features: imageAnalysis.features,
        searchKeywords: imageAnalysis.searchKeywords,
      },
      generatedProductNames,
      imageUrl: imageAnalysis.imageUrl || imageUrl,
    });
  } catch (error) {
    console.error("제품명 생성 오류:", error);
    return NextResponse.json(
      { error: `제품명 생성 중 오류가 발생했습니다: ${error.message}` },
      { status: 500 }
    );
  }
}
