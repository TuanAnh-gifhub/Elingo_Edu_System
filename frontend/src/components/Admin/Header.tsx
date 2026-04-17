import React from "react";
import { Layout, Button, Avatar, Dropdown, type MenuProps } from "antd";
import {
  UserOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
} from "@ant-design/icons";
// 1. Import kiểu dữ liệu thật từ service
import { type UserResponse } from "../../services/usersService";

const { Header } = Layout;

interface AdminHeaderProps {
  collapsed: boolean;
  toggleCollapsed: () => void;
  // 2. Sửa dòng này: Thay AdminUser bằng UserResponse
  adminUser: UserResponse | null;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({
  collapsed,
  toggleCollapsed,
  adminUser,
}) => {
  // 3. Kiểm tra xem UserResponse của bạn dùng trường nào (fullName hay name?)
  // Ví dụ ở đây tôi đang giả định là fullName, nếu API trả về name thì sửa thành adminUser.name
  const displayName = adminUser?.userName || "Admin";

  const userMenu: MenuProps["items"] = [
    { key: "1", label: "Hồ sơ cá nhân" },
    { key: "2", label: "Cài đặt" },
  ];

  return (
    <Header
      className="px-4 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md transition-colors duration-200 border-b bg-white/90 border-white/30"
      style={{
        paddingInline: 16,
        height: 64,
        lineHeight: "64px",
        background: "rgba(255, 255, 255, 0.95)",
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      <div className="flex items-center gap-4">
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={toggleCollapsed}
          style={{
            fontSize: "16px",
            width: 64,
            height: 64,
            color: "inherit",
          }}
        />
      </div>

      <div className="flex items-center gap-4">
        <Dropdown menu={{ items: userMenu }} placement="bottomRight">
          <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
            <div className="text-right hidden sm:block leading-tight text-gray-700">
              <div className="font-semibold text-sm">{displayName}</div>
              <div className="text-xs opacity-70">
                {adminUser?.role || "User"}
              </div>
            </div>
            <Avatar
              size="large"
              icon={<UserOutlined />}
              className="bg-blue-600"
            />
          </div>
        </Dropdown>
      </div>
    </Header>
  );
};

export default AdminHeader;
