import React from "react";
import { Navigate } from "react-router-dom";

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

export const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({ children }) => {
  const adminUserStr = localStorage.getItem("adminUser");
  const adminUser = adminUserStr ? JSON.parse(adminUserStr) : null;
  
  // Kiểm tra: không có token hoặc role là "User" (không phải Admin/Staff)
  if (!adminUser?.token || adminUser?.role === "User") {
    return <Navigate to="/admin/login" replace />;
  }
  
  return <>{children}</>;
};
