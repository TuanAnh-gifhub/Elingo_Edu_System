import api from "../config/axios";

// 1. Định nghĩa Interface khớp 100% với UserResponse.java
export interface UserResponse {
  userId: string;
  userName: string;
  fullName: string;
  email: string;
  gender: string;
  phone: string;
  dateOfBirth: string;
  age: number;
  role: string;
  createdAt: string;
  updatedAt: string;
  active: boolean;
}

// 2. Định nghĩa Wrapper (ApiResponse)
export interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

// 3. Định nghĩa Interface cho Request body của Reset Password
// (Khớp với ResetPasswordRequest bên Java)
export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export const userService = {
  getMe: () => {
    return api.get<any, ApiResponse<UserResponse>>("/users/me");
  },

  forgotPassword: (email: string) => {
    return api.post<any, ApiResponse<void>>("/users/forgot-password", null, {
      params: { email: email }
    });
  },

  resetPassword: (data: ResetPasswordRequest) => {
    return api.post<any, ApiResponse<void>>("/users/reset-password", data);
  }
};