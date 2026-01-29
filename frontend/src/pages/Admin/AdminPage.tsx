import React, { useState, useEffect } from "react";
import { Layout, ConfigProvider, theme as antTheme } from "antd";
import { Outlet } from "react-router-dom"; // Bỏ useNavigate vì AuthContext đã lo điều hướng
import Sidebar from "../../components/Admin/Sidebar";
import AdminHeader from "../../components/Admin/Header";
import { useAuth } from "../../context/AuthContext"; // <-- IMPORT QUAN TRỌNG

const { Content } = Layout;

const THEME_KEY = "adminTheme";

const AdminPage: React.FC = () => {
  // 1. Lấy user và hàm logout từ AuthContext
  const { user, logout } = useAuth();

  const [collapsed, setCollapsed] = useState<boolean>(false);

  // 2. Logic Theme (Giữ nguyên vì nó chỉ liên quan đến giao diện)
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem(THEME_KEY) === "dark";
  });

  useEffect(() => {
    const themeValue = isDark ? "dark" : "light";
    localStorage.setItem(THEME_KEY, themeValue);
    document.body.setAttribute("data-theme", themeValue);
  }, [isDark]);

  const handleThemeToggle = () => setIsDark((prev) => !prev);

  // 3. Hàm xử lý logout: Chỉ cần gọi hàm của Context
  const handleLogoutClick = async () => {
    await logout();
    // Không cần navigate ở đây nữa, vì AuthContext đã dùng window.location.href
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
        token: {
          colorPrimary: "#1677ff",
        },
      }}
    >
      <Layout className="h-screen overflow-hidden flex flex-row">
        <Sidebar
          collapsed={collapsed}
          toggleCollapsed={() => setCollapsed(!collapsed)}
          isDark={isDark}
          adminUser={user} // <-- Truyền user từ Context vào
          handleLogout={handleLogoutClick} // <-- Truyền hàm gọi context logout
        />

        <Layout className="flex flex-col flex-1 min-w-0 transition-all duration-200">
          <AdminHeader
            collapsed={collapsed}
            toggleCollapsed={() => setCollapsed(!collapsed)}
            adminUser={user} // <-- Truyền user từ Context vào
            isDark={isDark}
            onThemeToggle={handleThemeToggle}
          />

          <Content
            className={`flex-1 p-3 overflow-y-auto transition-colors duration-200 ${
              isDark ? "bg-[#141414]" : "bg-[#ffff]"
            }`}
          >
            <Outlet context={{ isDark }} />
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

export default AdminPage;
