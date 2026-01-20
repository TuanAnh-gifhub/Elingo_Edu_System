import api from "../../config/axios";

// --- 1. Định nghĩa Type (Interface) khớp với DTO của Backend ---

// Format trả về chung của Backend (ApiResponse class)
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

// --- 2. Auth Service ---

const authService = {
  /**
   * Đăng nhập thường (Username/Password)
   * Endpoint: POST /api/auth/login
   */
  login: async (data: LoginRequest) => {
    // Gọi API, axios sẽ tự nhận Cookie từ header Set-Cookie trả về
    const response = await api.post<ApiResponse<LoginResponse>>("/auth/login", data);
    return response.data;
  },

  /**
   * Đăng nhập bằng Google
   * Endpoint: POST /api/auth/google
   */
  loginGoogle: async (code: string) => {
    const payload: LoginGoogleRequest = { code };
    const response = await api.post<ApiResponse<LoginGoogleResponse>>("/auth/google", payload);
    return response.data;
  },

  /**
   * Đăng xuất
   * Endpoint: POST /api/auth/logout
   * Lưu ý: Vì dùng Cookie HttpOnly, browser sẽ tự gửi cookie đi kèm request này
   * để backend biết ai đang logout và xóa cookie đó.
   */
  logout: async () => {
    const response = await api.post<ApiResponse<void>>("/auth/logout");
    return response.data;
  },

  /**
   * Refresh Token thủ công (thường ít dùng trực tiếp vì Interceptor đã tự làm)
   * Endpoint: POST /api/auth/refresh
   */
  refreshToken: async () => {
    const response = await api.post<ApiResponse<void>>("/auth/refresh");
    return response.data;
  },
};

export default authService;