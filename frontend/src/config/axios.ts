import axios from 'axios';

export const AXIOS_AUTH_ERROR_EVENT = 'axios-auth-error';

const api = axios.create({
  baseURL: 'http://localhost:8080/api/v1/rent-room',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Nếu request login/logout bị lỗi thì trả về lỗi luôn, không retry (tránh loop)
    if (originalRequest.url && (originalRequest.url.includes("/auth/login") || originalRequest.url.includes("/auth/logout"))) {
        return Promise.reject(error);
    }

    // XỬ LÝ LỖI 401
    if (error.response?.status === 401 && !originalRequest._retry) {
      const currentPath = window.location.pathname;

      // 1. Nếu đang ở trang Admin (mà không phải trang login admin)
      // -> Redirect cứng về /admin/login
      if (currentPath.startsWith("/admin") && !currentPath.includes("/admin/login")) {
          window.location.href = "/admin/login";
          return Promise.reject(error);
      }

      // 2. Nếu đang ở trang Login Admin rồi -> Không làm gì cả (để UI hiện lỗi đỏ)
      if (currentPath.includes("/admin/login")) {
          return Promise.reject(error);
      }

      // 3. Nếu là User thường (đang ở trang chủ, sản phẩm...)
      // -> Logic cũ: Refresh token hoặc bắn Event
      if (originalRequest.url.includes("/auth/refresh")) {
          // Refresh thất bại -> Bắn event để App mở Modal Login
          window.dispatchEvent(new CustomEvent(AXIOS_AUTH_ERROR_EVENT));
          return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        await api.post("/auth/refresh");
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh thất bại -> Bắn event
        window.dispatchEvent(new CustomEvent(AXIOS_AUTH_ERROR_EVENT));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;