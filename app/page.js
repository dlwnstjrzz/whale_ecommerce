"use client";

import ProductForm from "./components/ProductForm";
import ResultSection from "./components/ResultSection";
import ErrorMessage from "./components/ErrorMessage";
import { useProductGenerator } from "./hooks/useProductGenerator";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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
