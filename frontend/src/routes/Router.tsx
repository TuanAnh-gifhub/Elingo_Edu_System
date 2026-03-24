import { createBrowserRouter, Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import RootLayout from "../layouts/RootLayout";
import LandingPage from "../pages/Customer/LandingPage/LandingPage";
import ChatBoxHome from "../pages/Customer/ChatBox/ChatBoxHome";
import WalletPage from "../pages/Customer/WalletPage/WalletPage";
import WalletHistoryPage from "../pages/Customer/WalletPage/WalletHistoryPage";
import WalletPromotion from "../pages/Customer/WalletPage/WalletPromotion";
import WalletDepositResultPage from "../pages/Customer/WalletPage/WalletDepositResultPage";
import DepositResultPage from "../pages/Customer/Payment/DepositResultPage";
import BookingPaymentResultPage from "../pages/Customer/Payment/BookingPaymentResultPage";
import NotFound from "../components/Error/NotFound";
import AdminPage from "../pages/Admin/AdminPage";
import LoginAdmin from "../pages/Admin/LoginAdmin";
import { ProtectedAdminRoute } from "./ProtectedAdminRouter";
import AdminWalletOverviewPage from "../pages/Admin/WalletManagement/AdminWalletOverviewPage";
import CommissionConfigManagementPage from "../pages/Admin/WalletManagement/CommissionConfigManagementPage";
import WalletFreezeManagementPage from "../pages/Admin/WalletManagement/WalletFreezeManagementPage";
import WalletWithdrawManagementPage from "../pages/Admin/WalletManagement/WalletWithdrawManagementPage";
import AboutUs from "../pages/Customer/AboutUs/AboutUs";
import ResetPassword from "../pages/Customer/LoginPage/ResetPassword";
import UserManagement from "../pages/Admin/UserManagement";
import ConfirmRegister from "../pages/Customer/LoginPage/ConfirmRegister";
import ClassListPage from "../pages/Customer/ClassRoom/ClassListPage";
import ClassDetailPage from "../pages/Customer/ClassRoom/ClassDetailPage";
import AssignmentListPage from "../pages/Customer/Assignment/AssignmentListPage";
import AssignmentDetailPage from "../pages/Customer/Assignment/AssignmentDetailPage";
import SubmissionDetailPage from "../pages/Customer/Assignment/SubmissionDetailPage";
import TeacherAssignmentPage from "../pages/Customer/Assignment/TeacherAssignmentPage";
import TeacherSubmissionPage from "../pages/Customer/Assignment/TeacherSubmissionPage";

const RequireAuth = ({ children }: { children: ReactNode }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

const RequireRole = ({
  children,
  allowRoles,
}: {
  children: ReactNode;
  allowRoles: string[];
}) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || !allowRoles.includes(user.role)) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

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
        path: "wallet/recharge",
        element: <WalletPage />,
        handle: { breadcrumb: "Nạp tiền" },
      },
      {
        path: "wallet/withdraw",
        element: <WalletPage />,
        handle: { breadcrumb: "Rút tiền" },
      },
      {
        path: "wallet/revenue",
        element: <WalletPage />,
        handle: { breadcrumb: "Doanh thu" },
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
        path: "payment/deposit-result",
        element: <DepositResultPage />,
        handle: { breadcrumb: "Kết quả nạp tiền" },
      },
      {
        path: "wallet/deposit/result",
        element: <WalletDepositResultPage />,
        handle: { breadcrumb: "Kết quả nạp tiền" },
      },
      {
        path: "payment/booking-result",
        element: <BookingPaymentResultPage />,
        handle: { breadcrumb: "Kết quả thanh toán" },
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
      {
        path: "assignments",
        element: (
          <RequireAuth>
            <AssignmentListPage />
          </RequireAuth>
        ),
        handle: { breadcrumb: "Bài tập" },
      },
      {
        path: "assignments/:assignmentId",
        element: (
          <RequireRole allowRoles={["STUDENT"]}>
            <AssignmentDetailPage />
          </RequireRole>
        ),
        handle: { breadcrumb: "Làm bài tập" },
      },
      {
        path: "submissions/:submissionId",
        element: (
          <RequireAuth>
            <SubmissionDetailPage />
          </RequireAuth>
        ),
        handle: { breadcrumb: "Kết quả bài nộp" },
      },
      {
        path: "teacher/assignments",
        element: (
          <RequireRole allowRoles={["TEACHER"]}>
            <TeacherAssignmentPage />
          </RequireRole>
        ),
        handle: { breadcrumb: "Quản lý bài tập" },
      },
      {
        path: "teacher/assignments/:assignmentId/submissions",
        element: (
          <RequireRole allowRoles={["TEACHER"]}>
            <TeacherSubmissionPage />
          </RequireRole>
        ),
        handle: { breadcrumb: "Chấm bài" },
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
      {
        path: "transactions",
        element: <WalletWithdrawManagementPage />,
      },
      {
        path: "wallet-overview",
        element: <AdminWalletOverviewPage />,
      },
      {
        path: "commission-config",
        element: <CommissionConfigManagementPage />,
      },
      {
        path: "wallet-freeze",
        element: <WalletFreezeManagementPage />,
      },
    ],
  },
]);
