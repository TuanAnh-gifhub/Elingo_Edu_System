import api from "../../config/axios";
import type { UserResponse } from "../usersService";

export interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginGoogleRequest {
  code: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export interface LoginGoogleResponse {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  picture: string;
}

export interface CreateUsersRequest {
  userName: string;
  gender: string;
  email: string;
  password?: string;
  phone: string;
  dateOfBirth: string;
  roleName: string;
  otp?: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

const authService = {
  login: async (data: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    const response = await api.post<ApiResponse<LoginResponse>>(
      "/auth/login",
      data,
    );

    if (response.data && response.data.code === 200) {
      const { accessToken, refreshToken } = response.data.result;
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
    }

    return response.data;
  },

  loginGoogle: async (code: string): Promise<ApiResponse<LoginGoogleResponse>> => {
    const payload: LoginGoogleRequest = { code };
    const response = await api.post<ApiResponse<LoginGoogleResponse>>(
      "/auth/google",
      payload,
    );
    return response.data;
  },

  refreshToken: async (): Promise<ApiResponse<void>> => {
    const response = await api.post<ApiResponse<void>>("/auth/refresh");
    return response.data;
  },

  registerRequest: async (data: CreateUsersRequest): Promise<ApiResponse<void>> => {
    const response = await api.post<ApiResponse<void>>(
      "/auth/register/request",
      data,
    );
    return response.data; // Trả về data chứa { code, message, result }
  },

  registerConfirm: (email: string, otp: string): Promise<ApiResponse<void>> => {
    return api.get<unknown, ApiResponse<void>>("/auth/register/confirm", {
      params: { email, otp },
    });
  },

  forgotPassword: (email: string): Promise<ApiResponse<void>> => {
    return api.post<unknown, ApiResponse<void>>("/auth/forgot-password", null, {
      params: { email: email },
    });
  },

  resetPassword: (data: ResetPasswordRequest): Promise<ApiResponse<void>> => {
    return api.post<unknown, ApiResponse<void>>("/auth/reset-password", data);
  },

  // Lấy thông tin user hiện tại sau khi đã có accessToken
  getCurrentUser: async (): Promise<ApiResponse<UserResponse>> => {
    const response = await api.get<unknown, ApiResponse<UserResponse>>(
      "/users/me",
    );
    return response;
  },
};

export default authService;
