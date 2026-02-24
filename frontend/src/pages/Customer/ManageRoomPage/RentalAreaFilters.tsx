import React from "react";
import { Button, Card, Input, Select, Space } from "antd";
import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import type { RentalAreaStatus } from "../../../services/rental-areas/rentalAreas";

const { Option } = Select;

type Props = {
  keyword: string;
  status?: RentalAreaStatus;
  loading: boolean;
  onKeywordChange: (v: string) => void;
  onStatusChange: (v?: RentalAreaStatus) => void;
  onRefresh: () => void;
};

const RentalAreaFilters: React.FC<Props> = ({
  keyword,
  status,
  loading,
  onKeywordChange,
  onStatusChange,
  onRefresh,
}) => {
  return (
    <Card className="mb-6 shadow-sm">
      <Space size="middle" wrap>
        <Input
          placeholder="Tìm kiếm theo tên tòa nhà hoặc địa chỉ..."
          prefix={<SearchOutlined />}
          value={keyword}
          onChange={(e) => onKeywordChange(e.target.value)}
          style={{ width: 320 }}
          allowClear
        />

        <Select
          placeholder="Lọc theo trạng thái"
          value={status}
          onChange={(value) => onStatusChange(value)}
          style={{ width: 200 }}
          allowClear
        >
          <Option value="ACTIVE">Đang hoạt động</Option>
          <Option value="INACTIVE">Ngừng hoạt động</Option>
          <Option value="SUSPENDED">Bị khóa</Option>
        </Select>

        <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading}>
          Làm mới
        </Button>
      </Space>
    </Card>
  );
};

export default RentalAreaFilters;
