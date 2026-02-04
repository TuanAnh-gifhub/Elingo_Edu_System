import React, { createContext, useContext, useState, useEffect } from "react";
// Đảm bảo đường dẫn import đúng với project của bạn
import { userService, type UserResponse } from "../services/usersService";

interface AuthContextType {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: UserResponse) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response: any = await userService.getMe();
      const actualData = response.data ? response.data : response;

      if (actualData?.result) {
        setUser(actualData.result);
      }
    } catch (error) {
      console.error("Fetch user thất bại, chờ interceptor refresh token...");
      // ❌ KHÔNG setUser(null) ở đây
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
    setIsLoading(false);
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
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
