import { Select, Input, Button, Space, DatePicker, Card } from "antd";
import { useState } from "react";
import dayjs, { Dayjs } from "dayjs";

const { RangePicker } = DatePicker;

export default function ReportFilter({ onChange }: any) {
  const [status, setStatus] = useState<string>();
  const [keyword, setKeyword] = useState<string>();
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>(null);

  const handleApply = () => {
    onChange({
      reportStatus: status,
      keyword: keyword?.trim() || undefined,
      fromDate: range?.[0]?.format("YYYY-MM-DD"),
      toDate: range?.[1]?.format("YYYY-MM-DD"),
    });
  };

  const handleReset = () => {
    setStatus(undefined);
    setKeyword(undefined);
    setRange(null);
    onChange({});
  };

  return (
    <div className="pb-2 flex justify-start items-end gap-2">
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <label style={{ fontSize: 12, color: "#8c8c8c" }}>Tiêu đề</label>
        <Input
          placeholder="Nhập  tiêu đề"
          style={{ width: 240 }}
          value={keyword}
          allowClear
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <label style={{ fontSize: 12, color: "#8c8c8c" }}>Trạng thái</label>
        <Select
          allowClear
          placeholder="Chọn trạng thái"
          style={{ width: 180 }}
          value={status}
          onChange={setStatus}
          options={[
            { value: "PENDING", label: "Chờ xử lý" },
            { value: "RESOLVED", label: "Đã xử lý" },
            { value: "REJECTED", label: "Từ chối" },
          ]}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <label style={{ fontSize: 12, color: "#8c8c8c" }}>Thời gian</label>
        <RangePicker
          allowClear
          style={{ width: 280 }}
          placeholder={["Từ ngày", "Đến ngày"]}
          value={range}
          onChange={(val) => setRange(val)}
        />
      </div>

      <Space>
        <Button type="primary" onClick={handleApply}>
          Tìm kiếm
        </Button>
        <Button onClick={handleReset}>Reset</Button>
      </Space>
    </div>
  );
}
