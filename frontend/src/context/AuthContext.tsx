import React, { createContext, useContext, useState, useEffect } from "react";
// Đảm bảo đường dẫn import đúng với project của bạn
import { userService, type UserResponse } from "../services/usersService";
import authService from "../services/auth/authService";

interface AuthContextType {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: UserResponse) => void;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // --- 1. Hàm check user khi reload trang (giữ nguyên) ---
  const fetchCurrentUser = async () => {
    setIsLoading(true);
    try {
      const response: any = await userService.getMe();
      const actualData = response.data ? response.data : response;

      if (actualData && actualData.code === 200 && actualData.result) {
        console.log("✅ Khôi phục phiên đăng nhập:", actualData.result);
        setUser(actualData.result);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Chạy 1 lần khi App mount
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = (userData: UserResponse) => {
    setUser(userData);
  };

  // --- 2. HÀM LOGOUT ĐÃ SỬA (QUAN TRỌNG) ---
  const logout = async () => {
    // A. Kiểm tra xem đang đứng ở trang Admin hay trang User
    const currentPath = window.location.pathname;
    const isAdminPage = currentPath.startsWith("/admin");

    try {
      // B. Gọi API logout (để Backend xóa Cookie)
      // Dù API lỗi (do token hết hạn) thì vẫn phải chạy tiếp các bước dưới
      await authService.logout();
    } catch (error) {
      console.error("Logout API failed:", error);
    }

    // C. Xóa user trong state
    setUser(null);

    // D. Điều hướng về đúng trang Login
    // Dùng window.location.href để reload sạch sẽ state của React
    if (isAdminPage) {
      window.location.href = "/admin/login";
    } else {
      window.location.href = "/"; // Hoặc "/login" tùy luồng User của bạn
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshProfile: fetchCurrentUser,
      }}
    >
      {/* Chỉ render con khi đã check xong session để tránh nháy giao diện */}
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
