# 이커머스 제품명 가공 서비스

이커머스 셀러들이 제품명을 가공할 때 도움을 주는 서비스입니다. 원본 제품명과 제품 이미지를 입력하면 SEO에 최적화된 제품명을 생성해줍니다.

## 주요 기능

1. **키워드 추출**: 원본 제품명에서 주요 검색 키워드를 추출합니다.
2. **연관 키워드 검색**: 네이버 검색 API를 통해 조회수 1200 이하, 쇼핑전환률이 0이 아닌 연관 키워드를 찾습니다.
3. **이미지 분석**: 제품 이미지를 분석하여 주요 특징을 추출합니다.
4. **키워드 선정**: 제품 특징에 맞는 연관 키워드를 3-5개 선정합니다.
5. **제품명 생성**: 선정된 키워드와 특징을 조합하여 자연스러운 제품명을 생성합니다.
6. **엑셀 다운로드**: 생성된 제품명을 엑셀 파일로 다운로드할 수 있습니다.

## 시작하기

### 필수 요구사항

- Node.js 18.0.0 이상
- OpenAI API 키
- 네이버 검색 API 키

### 설치

1. 저장소 클론하기

```bash
git clone https://github.com/yourusername/whale_ecommerce.git
cd whale_ecommerce
```

2. 의존성 설치하기

```bash
npm install
```

3. 환경 변수 설정하기
   `.env.local` 파일에 필요한 API 키를 입력합니다:

```
OPENAI_API_KEY=your_openai_api_key_here
NAVER_CLIENT_ID=your_naver_client_id_here
NAVER_CLIENT_SECRET=your_naver_client_secret_here
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속하여 앱을 사용할 수 있습니다.

## 사용 방법

1. 첫 화면에서 원본 제품명을 입력합니다.
2. '키워드 추출하기' 버튼을 클릭하여 주요 키워드를 추출합니다.
3. '연관 키워드 검색하기' 버튼을 클릭하여 네이버에서 연관 키워드를 찾습니다.
4. 제품 이미지 URL을 입력하고 '이미지 분석하기' 버튼을 클릭합니다.
5. 제품 특징과 선택된 키워드를 확인하고 '제품명 생성하기' 버튼을 클릭합니다.
6. 생성된 제품명 목록을 확인하고 '엑셀로 다운로드' 버튼을 클릭하여 결과를 저장합니다.

## 기술 스택

- Next.js 15
- React 19
- Tailwind CSS
- OpenAI API (GPT-4 Turbo, GPT-4 Vision)
- 네이버 검색 API
- PapaParse (CSV 생성)

## 배포

```bash
npm run build
npm start
```

## 라이센스

이 프로젝트는 MIT 라이센스로 제공됩니다. 자세한 내용은 LICENSE 파일을 참조하세요.
