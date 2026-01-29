import { createBrowserRouter } from "react-router-dom";
import RootLayout from "../layouts/RootLayout";
import LandingPage from "../pages/Customer/LandingPage/LandingPage";
import RoomDetailPage from "../pages/Customer/RoomDetailPage/RoomDetailPage";
import ChatBoxHome from "../pages/Customer/ChatBox/ChatBoxHome";
import WalletPage from "../pages/Customer/WalletPage/WalletPage";
import WalletHistoryPage from "../pages/Customer/WalletPage/WalletHistoryPage";
import WalletPromotion from "../pages/Customer/WalletPage/WalletPromotion";
import NotFound from "../components/Error/NotFound";
import AdminPage from "../pages/Admin/AdminPage";
import LoginAdmin from "../pages/Admin/LoginAdmin";
import { ProtectedAdminRoute } from "./ProtectedAdminRouter";
import AboutUs from "../pages/Customer/AboutUs/AboutUs";
import ReportPage from "../pages/Admin/ReportAdmin/ReportPage";
import ReportForm from "../pages/Customer/ReportPage/ReportForm";
import ResetPassword from "../pages/Customer/LoginPage/ResetPassword";
import UserManagement from "../pages/Admin/UserManagement";
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
        path: "product/:id",
        element: <RoomDetailPage />,
        handle: { breadcrumb: "Chi tiết phòng" },
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
        path: "about-us",
        element: <AboutUs />,
        handle: { breadcrumb: "Về chúng tôi" },
      },
      {
        path: "report-form",
        element: <ReportForm />,
        handle: { breadcrumb: "Báo cáo vi phạm" },
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
      // <ProtectedAdminRoute>
      <AdminPage />
      // </ProtectedAdminRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <div className="">
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
      {
        path: "reports",
        element: <ReportPage />,
      },
    ],
  },
]);
