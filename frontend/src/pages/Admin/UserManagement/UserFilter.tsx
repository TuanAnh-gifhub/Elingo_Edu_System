import React from "react";
import { Select, Input } from "antd";

const { Option } = Select;
const { Search } = Input;

interface UserFilterProps {
  filters: {
    role: string | undefined;
    active: boolean | undefined;
  };
  onFilterChange: (key: string, value: any) => void;
}

const UserFilter: React.FC<UserFilterProps> = ({ filters, onFilterChange }) => {
  return (
    <div className="mb-4 flex gap-4 flex-wrap">
      <Select
        placeholder="Chọn vai trò"
        style={{ width: 200 }}
        allowClear
        onChange={(value) => onFilterChange("role", value)}
        value={filters.role}
      >
        <Option value="ADMIN">Quản trị viên (ADMIN)</Option>
        <Option value="OWNER">Chủ xe (OWNER)</Option>
        <Option value="RENTER">Khách thuê (RENTER)</Option>
      </Select>

      <Select
        placeholder="Trạng thái"
        style={{ width: 200 }}
        onChange={(value) => onFilterChange("active", value)}
        value={filters.active}
      >
        <Option value={undefined}>Tất cả trạng thái</Option>
        <Option value={true}>Đang hoạt động</Option>
        <Option value={false}>Đã bị khóa</Option>
      </Select>

      <Search
        placeholder="Tìm theo tên, email, sđt..."
        allowClear
        enterButton="Tìm kiếm"
        size="middle"
        style={{ width: 300 }}
        onSearch={(value) => onFilterChange("keyword", value)}
      />
    </div>
  );
};

export default UserFilter;
