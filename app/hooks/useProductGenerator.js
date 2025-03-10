import { useState } from "react";
import * as productService from "../services/product";

export function useProductGenerator() {
  const [productName, setProductName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!productName || !imageUrl) {
      setError("제품명과 이미지 URL을 모두 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await productService.generateProductName(
        productName,
        imageUrl
      );
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    productService.generateExcelFile(result);
  };

  return {
    productName,
    setProductName,
    imageUrl,
    setImageUrl,
    isLoading,
    error,
    result,
    handleSubmit,
    handleDownload,
  };
}
