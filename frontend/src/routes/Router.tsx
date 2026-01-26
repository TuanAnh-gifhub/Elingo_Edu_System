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
import LoginAdmin from "../pages/Admin/LoginAdmin/LoginAdmin";
import { ProtectedAdminRoute } from "./ProtectedAdminRouter";

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
        path: "*",
        element: <NotFound />,
        handle: { breadcrumb: "Không tìm thấy" },
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
            <h1 className="text-2xl font-bold mb-4" style={{ color: "inherit" }}>
              Dashboard
            </h1>
            <p style={{ color: "inherit" }}>Chào mừng đến với trang quản trị!</p>
          </div>
        ),
      },
    ],
  },
]);
