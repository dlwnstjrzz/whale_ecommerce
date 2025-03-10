import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function KeywordResults({ data }) {
  if (!data) return null;

  // 데이터 구조 확인 및 필요한 정보 추출
  const renderKeywordData = () => {
    // 데이터 구조를 모르기 때문에 일단 기본적인 표시 방식 구현
    // API 응답 구조에 따라 이 부분을 수정해야 함

    // 키워드 정보가 있는지 확인
    if (data.keywords && Array.isArray(data.keywords)) {
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>순위</TableHead>
              <TableHead>키워드</TableHead>
              <TableHead>검색량</TableHead>
              <TableHead>경쟁강도</TableHead>
              <TableHead>상품수</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.keywords.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{index + 1}</TableCell>
                <TableCell className="font-medium">
                  {item.keyword || item.name || "알 수 없음"}
                </TableCell>
                <TableCell>{item.searchCount || item.count || "-"}</TableCell>
                <TableCell>{item.competition || "-"}</TableCell>
                <TableCell>{item.productCount || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }

    // 키워드 정보가 없거나 다른 구조인 경우 JSON으로 표시
    return (
      <div className="overflow-x-auto">
        <pre className="text-sm bg-gray-100 p-4 rounded-md overflow-auto max-h-96">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4">검색 결과</h2>

      {/* 메인 키워드 정보 */}
      {data.mainKeyword && (
        <div className="mb-6 p-4 bg-blue-50 rounded-md">
          <h3 className="text-lg font-semibold mb-2">메인 키워드 정보</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">키워드</p>
              <p className="font-medium">{data.mainKeyword.keyword || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">검색량</p>
              <p className="font-medium">
                {data.mainKeyword.searchCount || "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">경쟁강도</p>
              <p className="font-medium">
                {data.mainKeyword.competition || "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">상품수</p>
              <p className="font-medium">
                {data.mainKeyword.productCount || "-"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 관련 키워드 목록 */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">관련 키워드</h3>
        {renderKeywordData()}
      </div>
    </Card>
  );
}
