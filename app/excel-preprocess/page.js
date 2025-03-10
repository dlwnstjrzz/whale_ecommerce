"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as XLSX from "xlsx";

// HTML에서 첫 번째 이미지 URL 추출 함수
const extractFirstImageUrl = (html) => {
  if (!html || typeof html !== "string") return "";

  // img 태그의 src 속성 추출을 위한 정규식
  const imgRegex = /<img[^>]+src="([^">]+)"/i;
  const match = html.match(imgRegex);

  return match ? match[1] : "";
};

export default function ExcelPreprocessPage() {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (
      selectedFile?.type ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      setFile(selectedFile);
    } else {
      alert("엑셀 파일(.xlsx) 형식만 업로드 가능합니다.");
    }
  };

  const processExcel = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          // 헤더 행에 "상세이미지" 열 추가 (BZ열 = 인덱스 77)
          if (jsonData[0]) {
            jsonData[0][77] = "상세이미지";
          }

          for (let i = 2; i < jsonData.length; i++) {
            if (!jsonData[i]) jsonData[i] = [];

            // D열(인덱스 3) - 카테고리 번호
            jsonData[i][3] = "111001000";

            // F열(인덱스 5) - 판매가 계산
            const price = Number(jsonData[i][5]);
            if (!isNaN(price)) {
              let newPrice;
              if (price <= 5000) {
                newPrice = price * 1.75;
              } else if (price <= 10000) {
                newPrice = price * 1.7;
              } else if (price <= 30000) {
                newPrice = price * 1.7;
              } else if (price <= 50000) {
                newPrice = price * 1.68;
              } else if (price <= 70000) {
                newPrice = price * 1.65;
              } else {
                newPrice = price * 1.55;
              }
              jsonData[i][5] = Math.ceil(newPrice / 10) * 10;
            }

            // G열(인덱스 6) - 수량
            jsonData[i][6] = 999;

            // J열(인덱스 9) - 원산지
            if (jsonData[i][9] === "국산") {
              jsonData[i][9] = "국산/서울시/송파구";
            }

            // S열(인덱스 18) - 상세설명*에서 이미지 URL 추출
            if (jsonData[i][18] !== undefined) {
              // S열 데이터를 문자열로 안전하게 변환
              const htmlContent = String(jsonData[i][18]);
              jsonData[i][18] = htmlContent; // 문자열로 변환된 값으로 업데이트

              // 이미지 URL 추출
              const imageUrl = extractFirstImageUrl(htmlContent);

              // BZ열(인덱스 77)에 추출한 이미지 URL 저장
              if (imageUrl) {
                jsonData[i][77] = imageUrl;
              }
              // S열은 문자열로 변환된 상태로 유지
            }

            // V열(인덱스 21) - 선택사항 타입
            if (jsonData[i][21] === "독립형") {
              jsonData[i][21] = "조합형";
            }

            // W열(인덱스 22) - 선택사항 옵션명
            if (jsonData[i][22] === "색상" || jsonData[i][22] === "사이즈") {
              jsonData[i][22] = "선택사항";
            }
            // '색상 사이즈'는 그대로 유지

            // X열(인덱스 23) - 선택사항 상세정보 처리
            if (jsonData[i][23]) {
              const options = jsonData[i][23].split("\n");
              const modifiedOptions = options.map((option) => {
                // 마지막 *와 썸네일 URL 제거
                let optionStr = option.replace(/\*[^*]+$/, "");

                // 옵션 파싱 - **를 기준으로 분리
                let [optionPart, remainingPart] = optionStr.split("**");

                // 옵션 부분에서 '상품선택*' 제거
                optionPart = optionPart.replace(/^상품선택\*/, "");

                // remainingPart를 *로 분리
                let [additionalPrice, quantity, visible] =
                  remainingPart.split("*");

                // 2. 수량을 999로 통일
                quantity = "999";

                // 3. 추가금 처리
                if (additionalPrice && additionalPrice !== "0") {
                  let newAdditionalPrice = parseInt(additionalPrice) * 2;
                  const basePrice = jsonData[i][5]; // F열의 수정된 판매가
                  const halfBasePrice = Math.floor(basePrice / 2);

                  if (newAdditionalPrice > halfBasePrice) {
                    newAdditionalPrice = halfBasePrice;
                  }
                  additionalPrice = newAdditionalPrice.toString();
                }

                // 5. 색상-사이즈 형식 변경 (W열이 '색상 사이즈'인 경우)
                if (
                  jsonData[i][22] === "색상\n사이즈" &&
                  optionPart.includes("*")
                ) {
                  optionPart = optionPart.replace(/\*/g, "-");
                }

                // 옵션 재조합
                return `${optionPart}**${additionalPrice}*${quantity}*${visible}`;
              });

              // 수정된 옵션들을 다시 하나의 문자열로 결합
              jsonData[i][23] = modifiedOptions.join("\n");
            }
          }

          // 수정된 데이터로 새 워크시트 생성
          const newWorksheet = XLSX.utils.aoa_to_sheet(jsonData);
          const newWorkbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, "Sheet1");

          // 새 엑셀 파일 생성
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("파일을 선택해주세요.");
      return;
    }

    setIsProcessing(true);
    try {
      const processedBlob = await processExcel(file);

      // 파일 다운로드
      const url = window.URL.createObjectURL(processedBlob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `전처리_${file.name}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error processing file:", error);
      alert("파일 처리 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">엑셀 전처리</h1>

      <Card className="p-6">
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
          </div>

          <Button
            type="submit"
            disabled={!file || isProcessing}
            className="w-full"
          >
            {isProcessing ? "처리 중..." : "엑셀 전처리 실행하기"}
          </Button>
        </form>
      </Card>

      <Card className="p-6 mt-6">
        <h2 className="text-xl font-bold mb-4">전처리 내용</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>D열: 카테고리 번호를 111001000으로 통일</li>
          <li>F열: 판매가 계산 (가격대별 마진율 적용)</li>
          <li>G열: 수량을 999로 통일</li>
          <li>J열: 원산지 "국산"을 "국산/서울시/송파구"로 변경</li>
          <li>S열: 상세설명*에서 첫 번째 이미지 URL 추출</li>
          <li>V열: 선택사항 타입 "독립형"을 "조합형"으로 변경</li>
          <li>
            W열: 선택사항 옵션명 "색상" 또는 "사이즈"를 "선택사항"으로 변경
          </li>
          <li>X열: 선택사항 상세정보 처리 (추가금, 수량, 옵션 형식 변경)</li>
          <li>BZ열: 추출한 상세이미지 URL 추가</li>
        </ul>
      </Card>
    </div>
  );
}
