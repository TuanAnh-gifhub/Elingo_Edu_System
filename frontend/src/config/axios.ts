import axios from "axios"; // Import code logic (biến axios)
import type { 
  AxiosInstance, 
  AxiosError, 
  InternalAxiosRequestConfig, 
  AxiosResponse 
} from "axios";

// 1. Định nghĩa lại Interface để TypeScript hiểu được thuộc tính "_retry"
// Axios mặc định không có _retry, nên ta phải mở rộng (extend) nó.
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // Đảm bảo vite-env.d.ts đã được config
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// --- RESPONSE INTERCEPTOR ---
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    // Ép kiểu (Cast) error.config sang Interface chúng ta vừa tạo ở trên
    const originalRequest = error.config as ExtendedAxiosRequestConfig;

    // Kiểm tra: Lỗi 401, config tồn tại, và chưa từng retry
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await api.post("/auth/refresh");
        
        // Gọi lại request cũ sau khi refresh thành công
        return api(originalRequest);
      } catch (refreshError) {
        // Xử lý logout hoặc throw lỗi
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;