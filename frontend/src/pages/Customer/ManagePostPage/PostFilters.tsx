import React from "react";
import { Button, Card, Input, Select, Space } from "antd";
import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import type { PostStatus } from "../../../services/posts/posts";

const { Option } = Select;

type Props = {
  keyword: string;
  status?: PostStatus;
  loading?: boolean;

  onKeywordChange: (v: string) => void;
  onStatusChange: (v?: PostStatus) => void;
  onRefresh: () => void;
};

const PostFilters: React.FC<Props> = ({
  keyword,
  status,
  loading = false,
  onKeywordChange,
  onStatusChange,
  onRefresh,
}) => {
  return (
    <Card className="mb-6 shadow-sm">
      <Space size="middle" wrap>
        <Input
          placeholder="Tìm theo tiêu đề / tên phòng / địa chỉ..."
          prefix={<SearchOutlined />}
          value={keyword}
          onChange={(e) => onKeywordChange(e.target.value)}
          style={{ width: 320 }}
          allowClear
        />

        <Select
          placeholder="Lọc theo trạng thái"
          value={status}
          onChange={(v) => onStatusChange(v)}
          style={{ width: 220 }}
          allowClear
        >
          <Option value="PENDING">Chờ duyệt</Option>
          <Option value="PUBLISHED">Đã đăng</Option>
          <Option value="HIDDEN">Đang ẩn</Option>
          <Option value="DELETED">Đã xóa</Option>
        </Select>

        <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading}>
          Làm mới
        </Button>
      </Space>
    </Card>
  );
};

export default PostFilters;
