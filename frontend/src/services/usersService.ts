import api from "../config/axios";

// 1. Định nghĩa Interface khớp 100% với UserResponse.java
export interface UserResponse {
  userId: string;
  userName: string;
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

export interface PageResponse<T> {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalElements: number;
  data: T[];
}

// 3. Định nghĩa Interface cho Request body của Reset Password
// (Khớp với ResetPasswordRequest bên Java)
export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface UpdateUserRequest {
  userName: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
}

export interface UpdateUserStatusRequest {
  status: boolean;
}

export const userService = {
  getMe: () => {
    return api.get<any, ApiResponse<UserResponse>>("/users/profile");
  },

  forgotPassword: (email: string) => {
    return api.post<any, ApiResponse<void>>("/users/forgot-password", null, {
      params: { email: email },
    });
  },

  resetPassword: (data: ResetPasswordRequest) => {
    return api.post<any, ApiResponse<void>>("/users/reset-password", data);
  },

  getAllUsers: (
    page: number,
    size: number,
    role?: string,
    active?: boolean,
    keyword?: string,
  ) => {
    const params: any = { page, size };

    if (role) params.role = role;
    if (active !== undefined) params.active = active;
    if (keyword) params.keyword = keyword;
    return api.get("/users/all", { params });
  },

  updateUser: (userId: string, data: UpdateUserRequest) => {
    return api.put<any, ApiResponse<UserResponse>>(`/users/${userId}`, data);
  },

  updateStatus: (userId: string, newStatus: boolean) => {
    return api.patch<any, ApiResponse<void>>(`/users/${userId}`, {
      status: newStatus,
    });
  },
};
