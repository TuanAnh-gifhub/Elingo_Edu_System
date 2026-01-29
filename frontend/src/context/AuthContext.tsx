import React, { createContext, useContext, useState, useEffect } from "react";
import { userService, type UserResponse } from "../services/usersService";
import authService from "../services/auth/authService";
import { message } from "antd";
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
  const [messageApi, contextHolder] = message.useMessage();
  const fetchCurrentUser = async () => {
    setIsLoading(true);
    try {
      const response: any = await userService.getMe();

      console.log("🚀 Debug API Response:", response); // Bật F12 xem dòng này in ra gì

      const actualData = response.data ? response.data : response;

      if (actualData && actualData.code === 200 && actualData.result) {
        setUser(actualData.result);
      } else {
        setUser(null);
      }
    } catch (error: any) {
      console.log("⚠️ Lỗi mạng hoặc chưa đăng nhập (403/401)");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = (userData: UserResponse) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
    setUser(null);

    window.location.href = "/";
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
      {contextHolder}
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
