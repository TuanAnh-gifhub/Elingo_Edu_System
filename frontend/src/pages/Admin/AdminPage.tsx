import React, { useState, useEffect, useMemo } from "react";
import { Layout, Button } from "antd";
import { Outlet, useNavigate } from "react-router-dom";
import { BulbOutlined, BulbFilled } from "@ant-design/icons";
import Sidebar from "../../components/Admin/Sidebar";
import AdminHeader from "../../components/Admin/Header";

const { Content } = Layout;

interface AdminUser {
  token?: string;
  role?: string;
  fullName?: string;
  [key: string]: unknown;
}

const THEME_STORAGE_KEY = "adminTheme";
const ADMIN_USER_STORAGE_KEY = "adminUser";

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [theme, setTheme] = useState<string>(
    localStorage.getItem(THEME_STORAGE_KEY) || "light"
  );

  const adminUser: AdminUser | null = useMemo(() => {
    try {
      const userStr = localStorage.getItem(ADMIN_USER_STORAGE_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }, []);

  const isDark = theme === "dark";

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    document.body.setAttribute("data-theme", theme);
  }, [theme]);

  const handleThemeToggle = (): void => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const handleLogout = (): void => {
    localStorage.clear();
    navigate("/admin/login");
  };

  const toggleCollapsed = (): void => {
    setCollapsed((prev) => !prev);
  };

  const mainLayoutStyle: React.CSSProperties = useMemo(
    () => ({
      flex: 1,
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      minWidth: 0,
    }),
    []
  );

  const contentStyle: React.CSSProperties = useMemo(
    () => ({
      padding: 24,
      flex: 1,
      background: isDark ? "#111827" : "#ffffff",
      color: isDark ? "#ffffff" : "#1f2937",
      overflowY: "auto",
      transition: "background-color 0.2s, color 0.2s",
    }),
    [isDark]
  );

  const themeButtonStyle: React.CSSProperties = useMemo(
    () => ({
      backgroundColor: isDark ? "#374151" : "#ffffff",
      borderColor: isDark ? "#4B5563" : "#D1D5DB",
      color: isDark ? "#FBBF24" : "#1F2937",
    }),
    [isDark]
  );

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        handleLogout={handleLogout}
        collapsed={collapsed}
        toggleCollapsed={toggleCollapsed}
        theme={theme}
      />
      <Layout style={mainLayoutStyle} className="flex flex-col">
        <AdminHeader
          collapsed={collapsed}
          toggleCollapsed={toggleCollapsed}
          adminUser={adminUser}
          theme={theme}
        />
        <div className="absolute top-4 right-4 z-10">
          <Button
            shape="circle"
            size="large"
            onClick={handleThemeToggle}
            icon={isDark ? <BulbFilled /> : <BulbOutlined />}
            title={isDark ? "Chuyển sang Light Mode" : "Chuyển sang Dark Mode"}
            style={themeButtonStyle}
          />
        </div>
        <Content style={contentStyle}>
          <Outlet context={{ theme }} />
        </Content>
      </Layout>
    </div>
  );
};

export default AdminPage;
