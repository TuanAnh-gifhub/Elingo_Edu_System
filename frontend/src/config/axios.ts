import axios from "axios";

export const AXIOS_AUTH_ERROR_EVENT = "axios-auth-error";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    const url = originalRequest.url || "";
    if (url.startsWith("/auth")) return Promise.reject(error);

    // Nếu không phải 401 thì bỏ qua
    if (error.response?.status !== 401) return Promise.reject(error);

    // Tránh loop vô hạn
    if (originalRequest._retry) return Promise.reject(error);
    originalRequest._retry = true;

    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) throw new Error("No refresh token");

      // Gọi API refresh
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/refresh`,
        null,
        { headers: { Authorization: `Bearer ${refreshToken}` } },
      );

      const { accessToken, refreshToken: newRefreshToken } = res.data.result;

      // Lưu token mới
      localStorage.setItem("accessToken", accessToken);
      if (newRefreshToken)
        localStorage.setItem("refreshToken", newRefreshToken);

      // FIX CHÍNH: Ép token mới vào header của request bị lỗi
      originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;

      // FIX CHÍNH: Dùng axios(originalRequest) thay vì api(...) để ép nó dùng header mới này
      return axios(originalRequest);
    } catch (refreshError: any) {
      console.log("❌ REFRESH TOKEN FAIL:", refreshError.response?.status);
      console.log("❌ REFRESH RESPONSE:", refreshError.response?.data);

      if (
        refreshError.response?.status === 401 ||
        refreshError.response?.status === 400
      ) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.dispatchEvent(new CustomEvent(AXIOS_AUTH_ERROR_EVENT));
      }
      return Promise.reject(refreshError);
    }
  },
);

export default api;
