"use client";

import ProductForm from "./components/ProductForm";
import ResultSection from "./components/ResultSection";
import ErrorMessage from "./components/ErrorMessage";
import { useProductGenerator } from "./hooks/useProductGenerator";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const {
    productName,
    setProductName,
    imageUrl,
    setImageUrl,
    isLoading,
    error,
    result,
    handleSubmit,
    handleDownload,
  } = useProductGenerator();

  const [insightLoading, setInsightLoading] = useState(false);

  // 네이버 쇼핑인사이트 API 호출 함수
  const fetchShoppingInsight = async () => {
    try {
      setInsightLoading(true);

      // 현재 날짜 기준으로 한 달 전 날짜 계산
      const today = new Date();
      const lastMonth = new Date();
      lastMonth.setMonth(today.getMonth() - 1);

      // 날짜 포맷팅 (YYYY-MM-DD)
      const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const endDate = formatDate(today);
      const startDate = formatDate(lastMonth);

      // API 호출
      const response = await fetch("/api/naver-shopping-insight", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cid: "50004828", // 생활/건강 카테고리
          timeUnit: "date",
          startDate,
          endDate,
          page: 1,
          count: 20,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // 상위 5개 키워드 추출
        const topKeywords =
          data.data.ranks
            ?.slice(0, 5)
            .map((item) => item.keyword)
            .join(", ") || "데이터 없음";
        alert(`인기 검색어 TOP 5: ${topKeywords}`);
      } else {
        alert(`API 호출 실패: ${data.error || "알 수 없는 오류"}`);
      }
    } catch (error) {
      console.error("쇼핑인사이트 API 호출 오류:", error);
      alert(`API 호출 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setInsightLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">상품명 가공</h1>
          <div className="space-x-2">
            <Link href="/excel-preprocess">
              <Button variant="outline">엑셀 전처리</Button>
            </Link>
            <Link href="/bulk-product-name">
              <Button variant="outline">대량 상품명 가공</Button>
            </Link>
            <Link href="/keyword-search">
              <Button variant="outline">키워드 검색</Button>
            </Link>
            <Link href="/trademark-check">
              <Button variant="outline">상품명 브랜드 특허명 체크</Button>
            </Link>
            <Button
              variant="outline"
              onClick={fetchShoppingInsight}
              disabled={insightLoading}
            >
              {insightLoading ? "로딩 중..." : "인기 검색어 확인"}
            </Button>
          </div>
        </div>

        <ProductForm
          productName={productName}
          imageUrl={imageUrl}
          isLoading={isLoading}
          onProductNameChange={setProductName}
          onImageUrlChange={setImageUrl}
          onSubmit={handleSubmit}
        />

        <ErrorMessage message={error} />
        <ResultSection
          result={result}
          onDownload={handleDownload}
          imageUrl={imageUrl}
        />
      </div>
    </main>
  );
}
