import { createBrowserRouter } from "react-router-dom";
import RootLayout from "../layouts/RootLayout";
import LandingPage from "../pages/Customer/LandingPage/LandingPage";
import ChatBoxHome from "../pages/Customer/ChatBox/ChatBoxHome";
import WalletPage from "../pages/Customer/WalletPage/WalletPage";
import WalletHistoryPage from "../pages/Customer/WalletPage/WalletHistoryPage";
import WalletPromotion from "../pages/Customer/WalletPage/WalletPromotion";
import NotFound from "../components/Error/NotFound";
import AdminPage from "../pages/Admin/AdminPage";
import LoginAdmin from "../pages/Admin/LoginAdmin";
import { ProtectedAdminRoute } from "./ProtectedAdminRouter";
import AboutUs from "../pages/Customer/AboutUs/AboutUs";
import ResetPassword from "../pages/Customer/LoginPage/ResetPassword";
import UserManagement from "../pages/Admin/UserManagement";
import ConfirmRegister from "../pages/Customer/LoginPage/ConfirmRegister";
import ClassListPage from "../pages/Customer/ClassRoom/ClassListPage";
import ClassDetailPage from "../pages/Customer/ClassRoom/ClassDetailPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    handle: { breadcrumb: "Trang chủ" },
    children: [
      {
        index: true,
        element: <LandingPage />,
        handle: { breadcrumb: "Trang chủ" },
      },
      {
        path: "home",
        element: <LandingPage />,
        handle: { breadcrumb: "Trang chủ" },
      },
      {
        path: "landing",
        element: <LandingPage />,
        handle: { breadcrumb: "Trang chủ" },
      },
      {
        path: "chat",
        element: <ChatBoxHome />,
        handle: { breadcrumb: "Chat" },
      },
      {
        path: "wallet",
        element: <WalletPage />,
        handle: { breadcrumb: "Ví cá nhân" },
      },
      {
        path: "wallet/history",
        element: <WalletHistoryPage />,
        handle: { breadcrumb: "Lịch sử giao dịch" },
      },
      {
        path: "wallet/promotion",
        element: <WalletPromotion />,
        handle: { breadcrumb: "Khuyến mãi" },
      },
      {
        path: "reset-password",
        element: <ResetPassword />,
        handle: { breadcrumb: "Đặt lại mật khẩu" },
      },
      {
        path: "*",
        element: <NotFound />,
        handle: { breadcrumb: "Không tìm thấy" },
      },
      {
        path: "admin",
        element: <NotFound />,
        handle: { breadcrumb: "Không tìm thấy" },
      },
      {
        path: "register/confirm",
        element: <ConfirmRegister />,
        handle: { breadcrumb: "Xác nhận tài khoản" },
      },
      {
        path: "about-us",
        element: <AboutUs />,
        handle: { breadcrumb: "Về chúng tôi" },
      },
      {
        path: "classes",
        element: <ClassListPage />,
        handle: { breadcrumb: "Danh sách lớp học" },
      },
      {
        path: "classes/:classId",
        element: <ClassDetailPage />,
        handle: { breadcrumb: "Chi tiết lớp học" },
      },
    ],
  },
  // Admin routes
  {
    path: "/admin/login",
    element: <LoginAdmin />,
  },
  {
    path: "/admin",
    element: (
      <ProtectedAdminRoute>
        <AdminPage />
      </ProtectedAdminRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <div className="p-6">
            <h1
              className="text-2xl font-bold mb-4"
              style={{ color: "inherit" }}
            >
              Dashboard
            </h1>
            <p style={{ color: "inherit" }}>
              Chào mừng đến với trang quản trị!
            </p>
          </div>
        ),
      },
      {
        path: "customers",
        element: <UserManagement />,
      },
    ],
  },
]);
