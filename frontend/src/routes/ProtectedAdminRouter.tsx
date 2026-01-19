import React from "react";
import { Navigate } from "react-router-dom";

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

export const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({ children }) => {
  const adminUserStr = localStorage.getItem("adminUser");
  const adminUser = adminUserStr ? JSON.parse(adminUserStr) : null;
  
  if (!adminUser?.token || adminUser?.role === "CUSTOMER") {
    return <Navigate to="/admin/login" replace />;
  }
  
  return <>{children}</>;
};
