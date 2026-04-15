import React, { useState } from "react";
import { Layout, Menu, type MenuProps } from "antd";
import { Link, useLocation } from "react-router-dom";
import {
  AppstoreOutlined,
  CalendarOutlined,
  TeamOutlined,
  ShopOutlined,
  DollarOutlined,
  SettingOutlined,
  LogoutOutlined,
  StarOutlined,
  CrownOutlined,
  MessageOutlined,
} from "@ant-design/icons";

const { Sider } = Layout;

type MenuItem = Required<MenuProps>["items"][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
  } as MenuItem;
}

interface SidebarProps {
  collapsed: boolean;
  toggleCollapsed: () => void;
  isDark: boolean;
  handleLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  isDark,
  handleLogout,
}) => {
  const location = useLocation();
  const [openKeys, setOpenKeys] = useState<string[]>([]);

  const onOpenChange: MenuProps["onOpenChange"] = (keys) => {
    setOpenKeys(keys);
  };

  // --- CẤU HÌNH MENU CHO THUÊ PHÒNG ---
  const items: MenuItem[] = [
    // 1. Tổng quan
    getItem(<Link to="/admin">Dashboard</Link>, "/admin", <AppstoreOutlined />),

    // 2. Nghiệp vụ chính: Quản lý Lịch đặt
    getItem("Quản lý Đặt phòng", "sub_booking", <CalendarOutlined />, [
      getItem(
        <Link to="/admin/bookings/calendar">Lịch phòng (Calendar)</Link>,
        "/admin/bookings/calendar",
      ),
      getItem(
        <Link to="/admin/bookings/list">Danh sách đơn đặt</Link>,
        "/admin/bookings/list",
      ),
      getItem(
        <Link to="/admin/bookings/check-in">Check-in/Check-out</Link>,
        "/admin/bookings/check-in",
      ),
    ]),

    // 3. Quản lý Tài nguyên (Phòng ốc) -> BỎ HẾT CHILD
    getItem(
      <Link to="/admin/rooms">Quản lý Phòng & Cơ sở</Link>,
      "/admin/rooms",
      <ShopOutlined />,
    ),

    // 4. Khách hàng
    getItem(
      <Link to="/admin/customers">Khách hàng</Link>,
      "/admin/customers",
      <TeamOutlined />,
    ),

    // 5. Tài chính
    getItem("Tài chính & Hóa đơn", "sub_finance", <DollarOutlined />, [
      getItem(
        <Link to="/admin/invoices">Hóa đơn dịch vụ</Link>,
        "/admin/invoices",
      ),
      getItem(
        <Link to="/admin/transactions">Lịch sử giao dịch</Link>,
        "/admin/transactions",
      ),
      getItem(
        <Link to="/admin/wallet-overview">Tổng quan ví hệ thống</Link>,
        "/admin/wallet-overview",
      ),
      getItem(
        <Link to="/admin/commission-config">Cấu hình Commission</Link>,
        "/admin/commission-config",
      ),
      getItem(
        <Link to="/admin/wallet-freeze">Khóa/Mở khóa ví</Link>,
        "/admin/wallet-freeze",
      ),
    ]),

    getItem(
      <Link to="/admin/reviews">Đánh giá từ khách</Link>,
      "/admin/reviews",
      <StarOutlined />,
    ),

    // Quản lý gói đăng ký
    getItem(
      <Link to="/admin/packages">Gói đăng ký</Link>,
      "/admin/packages",
      <CrownOutlined />,
    ),

    // Quản lý bài viết cộng đồng
    getItem(
      <Link to="/admin/community-posts">Bài viết cộng đồng</Link>,
      "/admin/community-posts",
      <MessageOutlined />,
    ),

    getItem("Cài đặt hệ thống", "sub_settings", <SettingOutlined />, [
      getItem(
        <Link to="/admin/room-types">Loại phòng</Link>,
        "/admin/room-types",
      ),
      getItem(
        <Link to="/admin/amenities">Thiết bị & Tiện ích</Link>,
        "/admin/amenities",
      ),
      getItem(
        <Link to="/admin/settings">Cài đặt chung</Link>,
        "/admin/settings",
      ),
    ]),

    // Logout
    getItem("Đăng xuất", "logout", <LogoutOutlined />),
  ];

  const handleMenuClick: MenuProps["onClick"] = (e) => {
    if (e.key === "logout") {
      handleLogout();
    }
  };

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      width={260}
      theme={isDark ? "dark" : "light"}
      className="shadow-md z-20"
      style={{
        borderRight: isDark ? "1px solid #303030" : "1px solid #f0f0f0",
      }}
    >
      {/* Logo Section */}
      <div
        className={`h-16 flex items-center justify-center border-b transition-colors ${isDark ? "border-gray-700 bg-[#001529]" : "border-gray-200 bg-white"
          }`}
      >
        <div className="flex items-center gap-2 overflow-hidden px-4">
          <div className="min-w-[32px] h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
            E
          </div>
          {!collapsed && (
            <div
              className={`font-bold text-xl tracking-tight whitespace-nowrap transition-opacity duration-300 ${isDark ? "text-white" : "text-gray-800"
                }`}
            >
              Elingo
            </div>
          )}
        </div>
      </div>

      <div className="h-[calc(100vh-64px)] overflow-y-auto custom-scrollbar py-2">
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          openKeys={openKeys}
          onOpenChange={onOpenChange}
          items={items}
          onClick={handleMenuClick}
          theme={isDark ? "dark" : "light"}
          style={{ border: "none", background: "transparent" }}
        />
      </div>
    </Sider>
  );
};

export default Sidebar;
