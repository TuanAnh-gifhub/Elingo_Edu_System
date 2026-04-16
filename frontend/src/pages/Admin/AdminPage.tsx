import React, { useState } from "react";
import { Layout, ConfigProvider, theme as antTheme } from "antd";
import { Outlet } from "react-router-dom"; // Bỏ useNavigate vì AuthContext đã lo điều hướng
import Sidebar from "../../components/Admin/Sidebar";
import AdminHeader from "../../components/Admin/Header";
import { useAuth } from "../../context/AuthContext"; // <-- IMPORT QUAN TRỌNG

const { Content } = Layout;

const AdminPage: React.FC = () => {
  // 1. Lấy user và hàm logout từ AuthContext
  const { user, logout } = useAuth();

  const [collapsed, setCollapsed] = useState<boolean>(false);

  // 2. Hàm xử lý logout: Chỉ cần gọi hàm của Context
  const handleLogoutClick = async () => {
    await logout();
    // Không cần navigate ở đây nữa, vì AuthContext đã dùng window.location.href
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: antTheme.defaultAlgorithm,
        token: {
          colorPrimary: "#1677ff",
        },
      }}
    >
      <Layout className="h-screen overflow-hidden flex flex-row">
        <Sidebar
          collapsed={collapsed}
          toggleCollapsed={() => setCollapsed(!collapsed)}
          handleLogout={handleLogoutClick} // <-- Truyền hàm gọi context logout
        />

        <Layout className="flex flex-col flex-1 min-w-0 transition-all duration-200">
          <AdminHeader
            collapsed={collapsed}
            toggleCollapsed={() => setCollapsed(!collapsed)}
            adminUser={user} // <-- Truyền user từ Context vào
          />

          <Content className="flex-1 p-3 overflow-y-auto bg-white transition-colors duration-200">
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

export default AdminPage;
