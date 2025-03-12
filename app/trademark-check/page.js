"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle, XCircle } from "lucide-react";

export default function TrademarkCheckPage() {
  const [productName, setProductName] = useState("");
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

  // 단일 상품명 검사
  const handleSingleCheck = async (e) => {
    e.preventDefault();

    if (!productName.trim()) {
      setError("상품명을 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch("/api/check-product-name", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API 요청 실패: ${response.status}`);
      }

      const data = await response.json();
      console.log("상표명 데이터", data);
      setResults({
        type: "single",
        data,
        isTrademark: Object.values(data.results).some(
          (result) => result.isTrademark
        ),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 엑셀 파일 변경 핸들러
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (
      selectedFile?.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      selectedFile?.type === "application/vnd.ms-excel"
    ) {
      setFile(selectedFile);
    } else {
      setError("엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.");
    }
  };

  // 엑셀 파일 처리
  const handleExcelCheck = async (e) => {
    e.preventDefault();

    if (!file) {
      setError("파일을 선택해주세요.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/check-product-names-excel", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API 요청 실패: ${response.status}`);
      }

      const data = await response.json();
      console.log("엑셀 검사 결과1", data);
      setResults({
        type: "excel",
        data,
        // isTrademark: Object.values(data.results).some(
        //   (result) => result.isTrademark
        // ),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 결과 다운로드
  const handleDownload = () => {
    if (!results) return;

    // 엑셀 파일 생성 로직 구현
    // ...
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">상품명 브랜드 특허명 체크</h1>

      <Tabs defaultValue="single" className="mb-8">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single">단일 상품명 검사</TabsTrigger>
          <TabsTrigger value="excel">엑셀 파일 검사</TabsTrigger>
        </TabsList>

        <TabsContent value="single">
          <Card className="p-6">
            <form onSubmit={handleSingleCheck} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="productName">상품명</Label>
                <Input
                  id="productName"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="검사할 상품명을 입력하세요"
                  className="mt-1"
                />
                <p className="text-sm text-gray-500">
                  * 상품명은 띄어쓰기 기준으로 단어를 나눠서 각 단어별로 상표
                  검색을 수행합니다.
                </p>
              </div>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    검사 중...
                  </>
                ) : (
                  "상표 검사하기"
                )}
              </Button>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="excel">
          <Card className="p-6">
            <form onSubmit={handleExcelCheck} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file">엑셀 파일 업로드</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                <p className="text-sm text-gray-500">
                  * .xlsx 또는 .xls 형식의 파일만 업로드 가능합니다.
                </p>
                <p className="text-sm text-gray-500">
                  * 엑셀 파일에서 "상품명", "제품명", "품명" 열을 자동으로
                  인식합니다.
                </p>
              </div>
              <Button
                type="submit"
                disabled={!file || isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    검사 중...
                  </>
                ) : (
                  "상표 검사하기"
                )}
              </Button>
            </form>
          </Card>
        </TabsContent>
      </Tabs>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>오류</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {results && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">검사 결과</h2>
            <Button onClick={handleDownload} disabled={!results}>
              결과 다운로드
            </Button>
          </div>

          {results.type === "single" && (
            <SingleResultView result={results.data} />
          )}

          {results.type === "excel" && (
            <ExcelResultView results={results.data} />
          )}
        </div>
      )}
    </div>
  );
}

// 단일 상품명 검사 결과 컴포넌트
function SingleResultView({ result }) {
  const { words, results: wordResults } = result;
  const isTrademark = Object.values(wordResults).some(
    (result) => result.isTrademark
  );

  return (
    <div className="mt-6">
      <h3 className="text-xl font-semibold mb-4">검사 결과</h3>
      <div className="space-y-4">
        {words.map((word, index) => {
          const wordResult = wordResults[word];
          return (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">
                  <span
                    className={
                      wordResult.similarity === 1
                        ? "text-red-600"
                        : wordResult.similarity === 0.5
                        ? "text-blue-600"
                        : "text-black"
                    }
                  >
                    {word}
                  </span>
                </h4>
                {wordResult.isTrademark ? (
                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                    상표 발견
                  </span>
                ) : (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                    안전
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">{wordResult.message}</p>

              {wordResult.isTrademark &&
                wordResult.data &&
                wordResult.data.items &&
                wordResult.data.items.length > 0 && (
                  <div className="mt-3">
                    <h5 className="text-sm font-medium mb-2">
                      발견된 상표 목록
                    </h5>
                    <div className="max-h-40 overflow-y-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                              상표명
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                              출원인
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                              출원번호
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                              출원일
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                              상태
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {wordResult.data.items
                            .slice(0, 5)
                            .map((item, idx) => (
                              <tr key={idx}>
                                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                                  {item.title}
                                  {item.drawing && (
                                    <a
                                      href={item.drawing}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="ml-2 text-blue-500 hover:underline"
                                    >
                                      <span className="text-xs">[이미지]</span>
                                    </a>
                                  )}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm">
                                  {item.applicantName}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm">
                                  {item.applicationNumber}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm">
                                  {item.applicationDate
                                    ? `${item.applicationDate.substring(
                                        0,
                                        4
                                      )}-${item.applicationDate.substring(
                                        4,
                                        6
                                      )}-${item.applicationDate.substring(
                                        6,
                                        8
                                      )}`
                                    : ""}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm">
                                  <span
                                    className={`px-2 py-1 text-xs rounded-full ${
                                      item.applicationStatus === "등록"
                                        ? "bg-green-100 text-green-800"
                                        : item.applicationStatus === "출원"
                                        ? "bg-blue-100 text-blue-800"
                                        : item.applicationStatus === "공고"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : item.applicationStatus === "소멸"
                                        ? "bg-gray-100 text-gray-800"
                                        : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {item.applicationStatus || "정보없음"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                      {wordResult.data.items.length > 5 && (
                        <p className="text-xs text-gray-500 mt-2">
                          외 {wordResult.data.items.length - 5}개 더 있음
                        </p>
                      )}
                    </div>
                  </div>
                )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 엑셀 파일 검사 결과 컴포넌트
function ExcelResultView({ results }) {
  console.log("엑셀 검사 결과", results);
  // 데이터 구조 확인 및 안전하게 처리
  const data = results.data || {};
  const summary = data.summary || { total: 0, safe: 0, caution: 0 };
  const productResults = data.results || [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-1">총 상품 수</h3>
          <p className="text-2xl font-bold">{summary.total}개</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-1">
            안전한 상품
          </h3>
          <p className="text-2xl font-bold text-green-600">{summary.safe}개</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-1">
            주의 필요 상품
          </h3>
          <p className="text-2xl font-bold text-red-600">{summary.caution}개</p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">상품별 검사 결과</h3>
        <div className="space-y-6">
          {productResults.map((product, index) => {
            // 상품의 단어 목록
            const words = product.words || [];
            // 상품의 검사 결과
            const productResults = product.results || {};

            // 상표 여부 확인 (하나라도 상표가 있으면 true)
            const hasTrademark = Object.values(productResults).some(
              (result) => result.isTrademark
            );

            return (
              <div
                key={index}
                className={`border-l-4 ${
                  hasTrademark
                    ? "border-red-500 bg-red-50"
                    : "border-green-500 bg-green-50"
                } p-4 rounded-md`}
              >
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">{words.join(" ")}</h4>
                  {hasTrademark ? (
                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                      주의 필요
                    </span>
                  ) : (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                      안전
                    </span>
                  )}
                </div>

                {hasTrademark && (
                  <div className="mt-2">
                    <h5 className="text-sm font-medium mb-2">
                      단어별 검사 결과
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {words.map((word, idx) => {
                        const wordResult = productResults[word];
                        if (!wordResult || !wordResult.isTrademark) return null;

                        return (
                          <span
                            key={idx}
                            className={`inline-block rounded px-2 py-1 text-xs ${
                              wordResult.similarity === 1
                                ? "bg-red-100 text-red-800"
                                : wordResult.similarity === 0.5
                                ? "bg-blue-100 text-blue-800"
                                : "bg-orange-100 text-orange-800"
                            }`}
                          >
                            <span
                              className={
                                wordResult.similarity === 1
                                  ? "text-red-800"
                                  : wordResult.similarity === 0.5
                                  ? "text-blue-800"
                                  : "text-orange-800"
                              }
                            >
                              {word}
                            </span>
                            <span className="ml-1">
                              ({wordResult.data.items.length})
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
