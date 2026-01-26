import { Layout, Menu } from "antd";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LineChartOutlined,
  LogoutOutlined,
  CaretRightOutlined,
  CaretLeftOutlined,
} from "@ant-design/icons";
import { useState, useEffect, useMemo } from "react";
import type { MenuProps } from "antd";

const { Sider } = Layout;

interface AdminUser {
  token?: string;
  role?: string;
  fullName?: string;
  [key: string]: unknown;
}

interface SidebarProps {
  collapsed: boolean;
  toggleCollapsed: () => void;
  theme: string;
  handleLogout: () => void;
}

const SIDEBAR_WIDTH = 280;
const ADMIN_USER_STORAGE_KEY = "adminUser";

const Sidebar: React.FC<SidebarProps> = ({ collapsed, toggleCollapsed, handleLogout, theme }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeKey, setActiveKey] = useState<string>(location.pathname);
  const isDark = theme === "dark";

  const adminUser: AdminUser | null = useMemo(() => {
    try {
      const userStr = localStorage.getItem(ADMIN_USER_STORAGE_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }, []);

  const userRole = adminUser?.role || "Admin";

  useEffect(() => {
    setActiveKey(location.pathname);
  }, [location.pathname]);

  const handleLogoutClick = (): void => {
    localStorage.removeItem(ADMIN_USER_STORAGE_KEY);
    navigate("/admin/login");
    handleLogout();
  };

  const adminMenuItems: MenuProps["items"] = useMemo(
    () => [
      {
        key: "/admin",
        icon: <LineChartOutlined className="text-lg" />,
        label: (
          <Link to="/admin" className="text-inherit hover:text-inherit">
            Dashboard
          </Link>
        ),
      },
      {
        key: "logout",
        icon: <LogoutOutlined className="text-lg" />,
        label: "Đăng xuất",
        danger: true,
        onClick: handleLogoutClick,
      },
    ],
    []
  );

  const otherRoleMenuItems: MenuProps["items"] = useMemo(
    () => [
      {
        key: "logout",
        icon: <LogoutOutlined className="text-lg" />,
        label: "Đăng xuất",
        danger: true,
        onClick: handleLogoutClick,
      },
    ],
    []
  );

  const menuItems = useMemo(
    () => (userRole === "Admin" ? adminMenuItems : otherRoleMenuItems),
    [userRole, adminMenuItems, otherRoleMenuItems]
  );

  const menuClassName = useMemo(
    () => `
    border-0 bg-transparent font-medium text-[15px] p-2
    [&_.ant-menu-item]:rounded-xl
    [&_.ant-menu-item]:mx-2
    [&_.ant-menu-item]:my-1
    [&_.ant-menu-item]:h-12
    [&_.ant-menu-item]:flex
    [&_.ant-menu-item]:items-center
    [&_.ant-menu-item]:transition-all
    [&_.ant-menu-item]:duration-200
    [&_.ant-menu-item]:ease-out
    ${isDark ? "[&_.ant-menu-item]:text-gray-300" : "[&_.ant-menu-item]:text-gray-700"}
    [&_.ant-menu-item:not(.ant-menu-item-selected):hover]:bg-blue-500/20
    [&_.ant-menu-item:not(.ant-menu-item-selected):hover]:translate-x-1
    [&_.ant-menu-item-selected]:bg-blue-600
    [&_.ant-menu-item-selected]:border-l-2
    [&_.ant-menu-item-selected]:border-l-blue-400
    [&_.ant-menu-item-selected]:text-white
    [&_.ant-menu-item-selected]:font-semibold
    [&_.ant-menu-item:last-child]:mt-auto
    ${isDark ? "[&_.ant-menu-item-dangerous]:text-red-400" : "[&_.ant-menu-item-dangerous]:text-red-600"}
    [&_.ant-menu-item-dangerous:hover]:bg-red-500
    [&_.ant-menu-item-dangerous:hover]:text-white
  `,
    [isDark]
  );

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      width={SIDEBAR_WIDTH}
      className={`admin-sider h-screen z-50 shadow-xl transition-all duration-300 ease-in-out ${
        isDark ? "bg-blue-900" : "bg-white"
      }`}
      style={{ borderRight: "none" }}
    >
      {/* Logo Section */}
      <div className={`p-5 border-b ${isDark ? "border-blue-800 bg-blue-900" : "border-gray-200 bg-white"}`}>
        <div className={`transition-all duration-300 ${collapsed ? "w-12 h-12 mx-auto" : "w-full"}`}>
          {collapsed ? (
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 border-2 ${
              isDark ? "border-white/10" : "border-gray-200"
            }`}>
              <span className="text-xl font-bold text-white">E</span>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-500 to-blue-600">
                <span className="text-lg font-bold text-white">E</span>
              </div>
              <div>
                <div className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>EduRoom</div>
                <div className={`text-xs font-medium mt-1 px-2 py-1 rounded-full text-center ${
                  isDark 
                    ? "bg-blue-500/20 text-blue-300" 
                    : "bg-blue-100 text-blue-700"
                }`}>
                  {userRole === "Admin" ? "Quản trị viên" : userRole}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="h-[calc(100vh-80px)] overflow-auto custom-scrollbar">
        <Menu
          theme={isDark ? "dark" : "light"}
          mode="inline"
          selectedKeys={[activeKey]}
          items={menuItems}
          className={menuClassName}
        />
      </div>

      {/* Collapse Toggle Button */}
      <div className="absolute -right-3 top-20 z-10">
        <button
          onClick={toggleCollapsed}
          className={`w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-0 cursor-pointer transition-all duration-200 hover:scale-110 text-white text-xs active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            isDark 
              ? "bg-blue-500 hover:bg-blue-600" 
              : "bg-blue-600 hover:bg-blue-700"
          }`}
          aria-label={collapsed ? "Mở rộng sidebar" : "Thu nhỏ sidebar"}
        >
          {collapsed ? <CaretRightOutlined /> : <CaretLeftOutlined />}
        </button>
      </div>
    </Sider>
  );
};

export default Sidebar;
