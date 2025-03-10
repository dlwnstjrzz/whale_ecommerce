"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import KeywordResults from "../components/KeywordResults";
import * as XLSX from "xlsx";
import CATEGORY_DATA from "@/data/category_data";
// 카테고리 ID 추출 함수
const extractCategoryId = (product) => {
  if (product.category4Id && product.category4Id !== "") {
    return {
      id: product.category4Id,
      name: product.category4Name,
      level: 4,
    };
  } else if (product.category3Id && product.category3Id !== "") {
    return {
      id: product.category3Id,
      name: product.category3Name,
      level: 3,
    };
  } else if (product.category2Id && product.category2Id !== "") {
    return {
      id: product.category2Id,
      name: product.category2Name,
      level: 2,
    };
  } else if (product.category1Id && product.category1Id !== "") {
    return {
      id: product.category1Id,
      name: product.category1Name,
      level: 1,
    };
  }
  return null;
};

export default function KeywordSearchPage() {
  const [keyword, setKeyword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [categoryInfo, setCategoryInfo] = useState(null);

  // 엑셀 처리 관련 상태
  const [file, setFile] = useState(null);
  const [isProcessingExcel, setIsProcessingExcel] = useState(false);
  const [processedKeywords, setProcessedKeywords] = useState([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!keyword.trim()) {
      setError("키워드를 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);
    setCategoryInfo(null);

    try {
      // 프록시 API 호출
      const apiUrl = `/api/keyword-search?keyword=${encodeURIComponent(
        keyword
      )}`;

      const response = await fetch(apiUrl);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API 요청 실패: ${response.status}`);
      }

      const data = await response.json();
      setResults(data);
      console.log("API 응답:", data);

      // 카테고리 ID 추출
      if (
        data.items &&
        data.items[0] &&
        data.items[0].prodArr &&
        data.items[0].prodArr.length > 0
      ) {
        const firstProduct = data.items[0].prodArr[0];
        const category = extractCategoryId(firstProduct);
        setCategoryInfo(category);
        console.log("추출된 카테고리 정보:", category);
      }
    } catch (err) {
      console.error("키워드 검색 중 오류 발생:", err);
      setError(`키워드 검색 중 오류가 발생했습니다: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 키워드로 카테고리 정보 검색
  const searchCategoryByKeyword = async (keyword) => {
    try {
      const apiUrl = `/api/keyword-search?keyword=${encodeURIComponent(
        keyword
      )}`;
      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status}`);
      }

      const data = await response.json();

      if (
        data.items &&
        data.items[0] &&
        data.items[0].prodArr &&
        data.items[0].prodArr.length > 0
      ) {
        const firstProduct = data.items[0].prodArr[0];
        return extractCategoryId(firstProduct);
      }

      return null;
    } catch (error) {
      console.error(`키워드 '${keyword}' 검색 중 오류:`, error);
      return null;
    }
  };

  // 엑셀 파일 변경 핸들러
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (
      selectedFile?.type ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      setFile(selectedFile);
      setProcessedKeywords([]);
      setProgress({ current: 0, total: 0 });
    } else {
      alert("엑셀 파일(.xlsx) 형식만 업로드 가능합니다.");
    }
  };

  // 엑셀 파일 처리
  const processExcel = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          // 헤더 행에 카테고리 관련 열 추가
          if (jsonData[0]) {
            jsonData[0][79] = "카테고리명"; // CB열 = 인덱스 79
            jsonData[0][80] = "네이버 카테고리ID"; // CC열 = 인덱스 80
          }

          // CA열(인덱스 78)에서 메인키워드 추출 및 처리
          const keywordsToProcess = [];

          // 2행은 건너뛰고 3행부터 처리
          for (let i = 2; i < jsonData.length; i++) {
            if (!jsonData[i]) continue;

            // 원본번호 부여 (3행부터 1,2,3...)
            const originalNumber = i - 1;

            const mainKeyword = jsonData[i][78]; // CA열 = 인덱스 78

            if (mainKeyword) {
              keywordsToProcess.push({
                index: i,
                originalNumber: originalNumber,
                keyword: String(mainKeyword),
              });
            }
          }

          setProgress({ current: 0, total: keywordsToProcess.length });

          const processed = [];

          // 키워드 검색 및 카테고리 정보 추출
          for (let i = 0; i < keywordsToProcess.length; i++) {
            const item = keywordsToProcess[i];
            try {
              const categoryInfo = await searchCategoryByKeyword(item.keyword);

              if (categoryInfo) {
                // CB열(인덱스 79)에 카테고리명 저장
                jsonData[item.index][79] = categoryInfo.name;

                // CC열(인덱스 80)에 카테고리 ID 저장
                jsonData[item.index][80] = categoryInfo.id;

                processed.push({
                  keyword: item.keyword,
                  categoryName: categoryInfo.name,
                  categoryId: categoryInfo.id,
                  level: categoryInfo.level,
                });
              } else {
                processed.push({
                  keyword: item.keyword,
                  error: "카테고리 정보를 찾을 수 없습니다.",
                });
              }
            } catch (error) {
              processed.push({
                keyword: item.keyword,
                error: error.message,
              });
            }

            setProgress({
              current: i + 1,
              total: keywordsToProcess.length,
            });
          }

          setProcessedKeywords(processed);

          // 업데이트된 데이터로 워크시트 생성
          const newWorksheet = XLSX.utils.aoa_to_sheet(jsonData);
          const newWorkbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, "기본정보");

          // 확장정보 시트 추가
          const extensionHeaders = [
            "원본번호*",
            "마켓 카테고리번호",
            "위메프2.0 담당MD",
            "스마트스토어 전용 상품명 사용 여부",
            "스마트스토어 전용 상품명",
            "병행수입여부 및 수입신고필증",
            "롯데ON 수입형태",
            "인보이스",
            "기타 구비서류",
            "쿠팡 옵션 할인율기준가",
            "쿠팡 옵션 대표이미지",
            "쿠팡 옵션 상세설명",
            "쿠팡 옵션 바코드",
            "쿠팡 옵션 인증정보",
            "쿠팡 옵션 모델번호",
            "쿠팡 옵션 검색옵션명",
            "쿠팡 옵션 검색옵션값",
            "11번가 상품속성",
            "스마트스토어 상품속성",
            "위메프2.0 상품속성 라벨",
            "위메프2.0 제휴채널 검색키워드",
            "티몬 법적허가 및 신고대상 상품",
            "확장정보 오류메시지",
          ];

          // 확장정보 시트 데이터 생성
          const extensionData = [extensionHeaders];

          // 2행은 비워두기
          extensionData.push(new Array(extensionHeaders.length).fill(""));

          // 카테고리명으로 변환값 찾기 함수
          const findConversionValueByCategory = (categoryName) => {
            if (!categoryName) return "";

            // category_data.json에서 일치하는 객체 찾기
            const matchingCategory = CATEGORY_DATA.find(
              (item) => item["네이버 카테고리명"] === categoryName
            );

            return matchingCategory ? matchingCategory["변환값"] : "";
          };

          // 원본번호별 데이터 매핑을 위한 객체 생성
          const processedDataByOriginalNumber = {};

          // 처리된 데이터를 원본번호별로 정리
          for (let i = 0; i < processed.length; i++) {
            const item = processed[i];
            const originalNumber = keywordsToProcess[i].originalNumber;

            processedDataByOriginalNumber[originalNumber] = {
              categoryName: item.categoryName || "",
              conversionValue: findConversionValueByCategory(
                item.categoryName || ""
              ),
            };
          }

          // 확장정보 시트에 데이터 추가 (3행부터 시작)
          // 최대 원본번호 찾기
          const maxOriginalNumber = Math.max(
            ...Object.keys(processedDataByOriginalNumber).map(Number)
          );

          // 1부터 최대 원본번호까지 순차적으로 행 추가
          for (
            let originalNumber = 1;
            originalNumber <= maxOriginalNumber;
            originalNumber++
          ) {
            const data = processedDataByOriginalNumber[originalNumber] || {};

            // 확장정보 시트에 행 추가
            const row = new Array(extensionHeaders.length).fill("");
            row[0] = String(originalNumber); // 원본번호* 열에 순차적인 번호 추가
            row[1] = data.conversionValue || ""; // 마켓 카테고리번호 열에 변환값 추가

            extensionData.push(row);
          }

          // 확장정보 시트 추가
          const extensionWorksheet = XLSX.utils.aoa_to_sheet(extensionData);
          XLSX.utils.book_append_sheet(
            newWorkbook,
            extensionWorksheet,
            "확장정보"
          );

          // 파일 다운로드
          const excelBuffer = XLSX.write(newWorkbook, {
            bookType: "xlsx",
            type: "array",
          });

          resolve(
            new Blob([excelBuffer], {
              type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            })
          );
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  };

  // 엑셀 처리 제출 핸들러
  const handleExcelSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("파일을 선택해주세요.");
      return;
    }

    setIsProcessingExcel(true);
    try {
      const processedBlob = await processExcel(file);

      // 파일 다운로드
      const url = window.URL.createObjectURL(processedBlob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `카테고리정보_${file.name}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error processing file:", error);
      alert("파일 처리 중 오류가 발생했습니다.");
    } finally {
      setIsProcessingExcel(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">키워드 검색</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 단일 키워드 검색 */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">단일 키워드 검색</h2>
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <Label htmlFor="keyword">검색 키워드</Label>
              <Input
                id="keyword"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="검색할 키워드를 입력하세요"
                className="mt-1"
              />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "검색 중..." : "검색"}
            </Button>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {categoryInfo && (
            <div className="mt-4 p-4 bg-green-50 rounded-md">
              <h3 className="font-medium text-green-800 mb-2">
                카테고리 정보 (레벨 {categoryInfo.level})
              </h3>
              <p>
                <span className="font-medium">카테고리명:</span>{" "}
                {categoryInfo.name}
              </p>
              <p>
                <span className="font-medium">카테고리 ID:</span>{" "}
                {categoryInfo.id}
              </p>
            </div>
          )}

          {results && <KeywordResults results={results} />}
        </Card>

        {/* 엑셀 파일 처리 */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">엑셀 파일 처리</h2>
          <form onSubmit={handleExcelSubmit} className="space-y-4">
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
                * CA열(메인키워드)의 데이터를 사용하여 카테고리 정보를
                검색합니다.
              </p>
              <p className="text-sm text-gray-500">
                * 검색 결과는 CB열(카테고리명)과 CC열(네이버 카테고리ID)에
                저장됩니다.
              </p>
              <p className="text-sm text-gray-500">
                * "확장정보" 시트가 추가되어 마켓별 추가 정보를 입력할 수
                있습니다.
              </p>
              <p className="text-sm text-gray-500">
                * 카테고리명을 기반으로 마켓별 카테고리 번호가 자동으로
                추가됩니다.
              </p>
            </div>

            <Button
              type="submit"
              disabled={!file || isProcessingExcel}
              className="w-full"
            >
              {isProcessingExcel ? (
                <div className="flex items-center justify-center">
                  <span className="mr-2">처리 중...</span>
                  <span className="text-xs">
                    ({progress.current}/{progress.total}) -{" "}
                    {Math.round((progress.current / progress.total) * 100)}%
                  </span>
                </div>
              ) : (
                "카테고리 정보 검색 및 마켓별 카테고리 번호 추가"
              )}
            </Button>
          </form>

          {processedKeywords.length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium mb-2">
                처리 결과 ({processedKeywords.length}개)
              </h3>
              <div className="max-h-96 overflow-y-auto border rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        키워드
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        카테고리명
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        카테고리ID
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {processedKeywords.map((item, idx) => (
                      <tr key={idx} className={item.error ? "bg-red-50" : ""}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">
                          {item.keyword}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">
                          {item.error ? (
                            <span className="text-red-500">{item.error}</span>
                          ) : (
                            item.categoryName
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">
                          {item.categoryId || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
