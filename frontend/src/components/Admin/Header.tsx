import React from "react";
import { Layout } from "antd";

const { Header } = Layout;

interface AdminUser {
  token?: string;
  role?: string;
  fullName?: string;
  [key: string]: unknown;
}

interface AdminHeaderProps {
  collapsed: boolean;
  toggleCollapsed: () => void;
  adminUser: AdminUser | null;
  theme: string;
}

const HEADER_HEIGHT = 64;

const AdminHeader: React.FC<AdminHeaderProps> = ({ adminUser, theme }) => {
  const displayName = adminUser?.fullName || "Admin User";
  const isDark = theme === "dark";

  return (
    <Header
      className={`admin-header px-4 flex items-center backdrop-blur-lg border-b transition-colors duration-200 ${
        isDark
          ? "bg-blue-900 border-blue-800 text-white"
          : "bg-white border-gray-200 text-gray-800"
      }`}
      style={{
        height: HEADER_HEIGHT,
        lineHeight: `${HEADER_HEIGHT}px`,
        position: "sticky",
        top: 0,
        zIndex: 10,
        width: "100%",
      }}
    >
      <div className={`font-semibold ml-10 ${isDark ? "text-gray-200" : "text-gray-700"}`}>
        Xin chào, <span className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{displayName}</span>!
      </div>
    </Header>
  );
};

export default AdminHeader;
