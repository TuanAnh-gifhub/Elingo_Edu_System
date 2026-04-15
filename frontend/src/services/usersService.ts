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
  emailVerified?: boolean;
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

export interface CreateUsersRequest {
  userName: string;
  gender: string;
  email: string;
  password?: string;
  phone: string;
  dateOfBirth: string;
  role: string;
  otp?: string;
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
    return api.get<any, ApiResponse<UserResponse>>("/users/me");
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
    return api.get("/users", { params });
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
