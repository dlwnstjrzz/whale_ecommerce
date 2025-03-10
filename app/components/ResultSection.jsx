import { HiOutlineDownload } from "react-icons/hi";

export default function ResultSection({ result, onDownload }) {
  if (!result) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-black">제품명 추천 결과</h2>
          <button
            onClick={onDownload}
            className="flex items-center text-primary hover:text-primary/80"
          >
            <HiOutlineDownload className="mr-1" />
            엑셀 다운로드
          </button>
        </div>
      </div>

      <div className="p-6">
        <OriginalName name={result.originalProductName} />
        <ImageAnalysis result={result} imageUrl={result.imageUrl} />
        <KeywordAnalysis result={result} />
        <RecommendedNames names={result.generatedProductNames} />
      </div>
    </div>
  );
}

function OriginalName({ name }) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-gray-500 mb-1">원본 제품명</h3>
      <p className="text-black">{name}</p>
    </div>
  );
}

function ImageAnalysis({ result, imageUrl }) {
  const handleImageClick = () => {
    window.open(imageUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-black mb-4">
        이미지 분석 결과
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2 mb-4">
          <h4 className="text-sm font-medium text-gray-500 mb-2">
            제품 이미지
          </h4>
          <div
            className="relative aspect-video w-full max-w-lg mx-auto overflow-hidden rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition"
            onClick={handleImageClick}
          >
            <img
              src={imageUrl}
              alt={result.originalProductName}
              className="object-contain w-full h-full"
            />
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-1">
            제품 카테고리
          </h4>
          <p className="text-black font-medium bg-purple-50 text-purple-700 rounded px-3 py-1.5 inline-block">
            {result.imageAnalysis.category}
          </p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-1">
            이미지 기반 검색 키워드
          </h4>
          <div>
            {result.imageAnalysis.searchKeywords.map((keyword, idx) => (
              <span
                key={idx}
                className="inline-block bg-indigo-50 text-indigo-700 rounded px-2 py-1 text-xs mr-2 mb-2"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          <h4 className="text-sm font-medium text-gray-500 mb-1">제품 특징</h4>
          <div>
            {result.imageAnalysis.features.map((feature, idx) => (
              <span
                key={idx}
                className="inline-block bg-blue-50 text-blue-700 rounded px-2 py-1 text-xs mr-2 mb-2"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KeywordAnalysis({ result }) {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-black mb-4">
        키워드 분석 결과
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-1">
            메인 검색 키워드
          </h4>
          <p className="text-black font-medium bg-rose-50 text-rose-700 rounded px-3 py-1.5 inline-block">
            {result.mainKeyword}
          </p>
        </div>
        <div className="md:col-span-2">
          <h4 className="text-sm font-medium text-gray-500 mb-1">
            연관 키워드
          </h4>
          <div className="max-h-48 overflow-y-auto pr-2">
            {result.rawData.map((item, idx) => (
              <span
                key={idx}
                className="inline-block bg-gray-100 rounded px-2 py-1 text-xs mr-2 mb-2"
              >
                {item.keyword}
                <span className="text-gray-500 ml-1">
                  ({item.monthlySearchVolume.toLocaleString()}회)
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RecommendedNames({ names }) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-black mb-4">추천 제품명</h3>
      <div className="space-y-3">
        {names.map((name, idx) => (
          <div
            key={idx}
            className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition"
          >
            <p className="text-black font-medium">{name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
