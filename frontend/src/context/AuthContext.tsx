import React, { createContext, useContext, useState, useEffect } from "react";
import { userService, type UserResponse } from "../services/usersService";
import authService from "../services/auth/authService";

interface AuthContextType {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: UserResponse) => void; // Hàm cập nhật state sau khi login thành công
  logout: () => Promise<void>; // Hàm gọi API logout và xóa state
  refreshProfile: () => Promise<void>; // Hàm gọi lại API getMe (dùng khi update profile hoặc login xong)
}

// Tạo Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    setIsLoading(true);
    try {
      const response: any = await userService.getMe();

      console.log("🚀 Debug API Response:", response); // Bật F12 xem dòng này in ra gì

      const actualData = response.data ? response.data : response;

      if (actualData && actualData.code === 200 && actualData.result) {
        console.log("✅ Đăng nhập thành công, user:", actualData.result);
        setUser(actualData.result);
      } else {
        console.log("❌ API trả về nhưng không đúng format:", actualData);
        setUser(null);
      }
    } catch (error: any) {
      console.log("⚠️ Lỗi mạng hoặc chưa đăng nhập (403/401)");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Chạy 1 lần khi App vừa load (F5 trang)
  useEffect(() => {
    setIsLoading(false);
  }, []);

  // Hàm Login: Chỉ đơn giản là cập nhật state (vì API login đã được gọi ở LoginPage rồi)
  const login = (userData: UserResponse) => {
    setUser(userData);
  };

  // Hàm Logout: Gọi API để xóa Cookie + Xóa state
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
    setUser(null);
    // Có thể điều hướng về trang chủ hoặc reload trang nếu cần
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user, // Nếu có user object -> true, ngược lại false
        isLoading,
        login,
        logout,
        refreshProfile: fetchCurrentUser,
      }}
    >
      {/* Mẹo UX: Nếu đang check login lần đầu (isLoading = true), 
        bạn có thể return null hoặc một cái Loading Spinner toàn màn hình 
        để tránh giao diện bị nháy từ "Login" -> "Avatar User"
      */}
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

// Custom Hook để dùng cho gọn
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
