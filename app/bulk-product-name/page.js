"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as XLSX from "xlsx";
import * as productService from "@/app/services/product";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function BulkProductNamePage() {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedNames, setSelectedNames] = useState({});
  const [editedNames, setEditedNames] = useState({});
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (
      selectedFile?.type ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      setFile(selectedFile);
      setResults([]);
      setSelectedNames({});
      setEditedNames({});
      setProgress({ current: 0, total: 0 });
    } else {
      alert("엑셀 파일(.xlsx) 형식만 업로드 가능합니다.");
    }
  };

  const processExcel = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          // 헤더 행이 있다고 가정하고 2번째 행부터 처리
          const productsToProcess = [];

          for (let i = 1; i < jsonData.length; i++) {
            if (!jsonData[i]) continue;

            // E열(인덱스 4) - 상품명*
            // BZ열(인덱스 77) - 상세이미지
            const productName = jsonData[i][4];
            const imageUrl = jsonData[i][77];

            if (productName && imageUrl) {
              productsToProcess.push({
                index: i,
                productName,
                imageUrl,
              });
            }
          }

          setProgress({ current: 0, total: productsToProcess.length });

          const processedResults = [];

          // 상품명 생성 처리
          for (let i = 0; i < productsToProcess.length; i++) {
            const product = productsToProcess[i];
            try {
              const result = await productService.generateProductName(
                product.productName,
                product.imageUrl
              );

              processedResults.push({
                index: product.index,
                originalProductName: product.productName,
                imageUrl: product.imageUrl,
                ...result,
              });

              setProgress({
                current: i + 1,
                total: productsToProcess.length,
              });
            } catch (error) {
              console.error(`상품 #${i + 1} 처리 중 오류:`, error);
              processedResults.push({
                index: product.index,
                originalProductName: product.productName,
                imageUrl: product.imageUrl,
                error: error.message,
              });
            }
          }

          setResults(processedResults);
          resolve(processedResults);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("파일을 선택해주세요.");
      return;
    }

    setIsProcessing(true);
    try {
      await processExcel(file);
    } catch (error) {
      console.error("Error processing file:", error);
      alert("파일 처리 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNameSelection = (productIndex, nameIndex) => {
    setSelectedNames({
      ...selectedNames,
      [productIndex]: nameIndex,
    });
  };

  const handleNameEdit = (productIndex, nameIndex, newValue) => {
    setEditedNames({
      ...editedNames,
      [`${productIndex}-${nameIndex}`]: newValue,
    });
  };

  const getProductName = (result, nameIndex) => {
    const key = `${result.index}-${nameIndex}`;
    if (editedNames[key]) {
      return editedNames[key];
    }
    // 넘버링 패턴(예: "1. ", "1) ", "#1 " 등)을 제거
    const name = result.generatedProductNames?.[nameIndex] || "";
    return name.replace(/^(\d+[\.\)\:]|\#\d+)\s+/g, "");
  };

  const handleExportToExcel = () => {
    if (results.length === 0) {
      alert("처리된 결과가 없습니다.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // 헤더 행에 "메인키워드" 열 추가 (CA열 = 인덱스 78)
      if (jsonData[0]) {
        jsonData[0][78] = "메인키워드";
      }

      // 선택된 상품명으로 E열 업데이트 및 메인 키워드를 CA열에 저장
      results.forEach((result) => {
        const rowIndex = result.index;
        const selectedNameIndex = selectedNames[rowIndex] || 0;

        // 편집된 상품명이 있으면 사용, 없으면 원래 추천 상품명 사용
        const selectedName = getProductName(result, selectedNameIndex);

        // E열(인덱스 4)에 선택된 상품명 업데이트
        jsonData[rowIndex][4] = selectedName;

        // CA열(인덱스 78)에 메인 키워드 저장
        if (result.mainKeyword) {
          jsonData[rowIndex][78] = result.mainKeyword;
        }
      });

      // 업데이트된 데이터로 워크시트 생성
      const newWorksheet = XLSX.utils.aoa_to_sheet(jsonData);
      const newWorkbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        newWorkbook,
        newWorksheet,
        workbook.SheetNames[0]
      );

      // 파일 다운로드
      XLSX.writeFile(newWorkbook, `updated_${file.name}`);
    };

    reader.onerror = (error) => {
      console.error("Error reading file:", error);
      alert("파일 읽기 중 오류가 발생했습니다.");
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">대량 상품명 가공</h1>

      <Card className="p-6 mb-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="file">엑셀 파일 업로드</Label>
            <Input
              id="file"
              type="file"
              accept=".xlsx"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            <p className="text-sm text-gray-500">
              * .xlsx 형식의 파일만 업로드 가능합니다.
            </p>
            <p className="text-sm text-gray-500">
              * E열(상품명*)과 BZ열(상세이미지)의 데이터를 사용하여 상품명을
              생성합니다.
            </p>
            <p className="text-sm text-gray-500">
              * 선택한 상품명은 E열에 저장되며, 메인 키워드는 CA열에 저장됩니다.
            </p>
            <p className="text-sm text-gray-500">
              * 추천 상품명을 직접 편집할 수 있으며, 편집한 상품명이 최종 결과에
              반영됩니다.
            </p>
          </div>

          <Button
            type="submit"
            disabled={!file || isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <div className="flex items-center justify-center">
                <span className="mr-2">처리 중...</span>
                <span className="text-xs">
                  ({progress.current}/{progress.total}) -{" "}
                  {Math.round((progress.current / progress.total) * 100)}%
                </span>
              </div>
            ) : (
              "상품명 생성하기"
            )}
          </Button>
        </form>
      </Card>

      {results.length > 0 && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              상품명 생성 결과 ({results.length}개)
            </h2>
            <Button onClick={handleExportToExcel}>
              엑셀로 정리하기 (E열: 상품명, CA열: 메인키워드)
            </Button>
          </div>

          <div className="space-y-6">
            {results.map((result, idx) => (
              <Card key={idx} className="p-4">
                {result.error ? (
                  <div className="text-red-500">
                    <p className="font-medium">오류 발생: {result.error}</p>
                    <p>원본 상품명: {result.originalProductName}</p>
                  </div>
                ) : (
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">
                          원본 상품명
                        </h3>
                        <p className="text-black">
                          {result.originalProductName}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">
                          상세 이미지
                        </h3>
                        <a
                          href={result.imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline truncate block"
                        >
                          {result.imageUrl}
                        </a>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">
                          이미지 특징
                        </h3>
                        <div className="flex flex-wrap gap-1">
                          {result.imageAnalysis?.features?.map((feature, i) => (
                            <span
                              key={i}
                              className="inline-block bg-blue-50 text-blue-700 rounded px-2 py-1 text-xs"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">
                          메인 키워드
                        </h3>
                        <span className="inline-block bg-rose-50 text-rose-700 rounded px-2 py-1 text-xs">
                          {result.mainKeyword}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">
                          연관 키워드
                        </h3>
                        <div className="flex flex-wrap gap-1">
                          {result.rawData?.map((item, i) => (
                            <span
                              key={i}
                              className="inline-block bg-gray-100 rounded px-2 py-1 text-xs"
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

                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">
                        추천 상품명
                      </h3>
                      <RadioGroup
                        value={selectedNames[result.index]?.toString() || "0"}
                        onValueChange={(value) =>
                          handleNameSelection(result.index, parseInt(value))
                        }
                        className="space-y-2"
                      >
                        {result.generatedProductNames?.map((name, nameIdx) => {
                          const isSelected =
                            (selectedNames[result.index] || 0) === nameIdx;
                          return (
                            <div
                              key={nameIdx}
                              className={`flex items-center space-x-2 p-2 rounded-lg ${
                                isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                              }`}
                            >
                              <RadioGroupItem
                                value={nameIdx.toString()}
                                id={`name-${idx}-${nameIdx}`}
                              />
                              <div className="flex-grow">
                                <Input
                                  value={getProductName(result, nameIdx)}
                                  onChange={(e) =>
                                    handleNameEdit(
                                      result.index,
                                      nameIdx,
                                      e.target.value
                                    )
                                  }
                                  className={`w-full ${
                                    isSelected
                                      ? "border-blue-500 ring-1 ring-blue-500"
                                      : "border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                  }`}
                                  placeholder="상품명 편집"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </RadioGroup>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
