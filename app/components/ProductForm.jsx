import { FaArrowRight, FaSpinner } from "react-icons/fa";

export default function ProductForm({
  productName,
  imageUrl,
  isLoading,
  onProductNameChange,
  onImageUrlChange,
  onSubmit,
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-6 mb-8 shadow-sm">
      <form onSubmit={onSubmit}>
        <div className="mb-6">
          <label
            htmlFor="productName"
            className="block text-black font-medium mb-2"
          >
            제품명
          </label>
          <input
            id="productName"
            type="text"
            value={productName}
            onChange={(e) => onProductNameChange(e.target.value)}
            placeholder="원형 라탄 빨래바구니 세탁물분리함"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="mb-6">
          <label
            htmlFor="imageUrl"
            className="block text-black font-medium mb-2"
          >
            제품 이미지 URL
          </label>
          <input
            id="imageUrl"
            type="text"
            value={imageUrl}
            onChange={(e) => onImageUrlChange(e.target.value)}
            placeholder="https://example.com/product-image.jpg"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary py-3 rounded-lg font-medium hover:bg-primary/90 transition disabled:opacity-50 flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <FaSpinner className="animate-spin mr-2" />
              제품명 생성 중...
            </>
          ) : (
            <>
              제품명 생성하기
              <FaArrowRight className="ml-2" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
