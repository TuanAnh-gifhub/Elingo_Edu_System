import axios from 'axios';

// Tạo event để lắng nghe ở phía React Component
export const AXIOS_AUTH_ERROR_EVENT = 'axios-auth-error';

const api = axios.create({
  baseURL: 'http://localhost:8080/api/v1/rent-room',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ... imports

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (originalRequest.url && (originalRequest.url.includes("/auth/login") || originalRequest.url.includes("/auth/logout"))) {
        return Promise.reject(error);
    }
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      if (originalRequest.url.includes("/auth/refresh")) {
          window.dispatchEvent(new CustomEvent(AXIOS_AUTH_ERROR_EVENT));
          return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        await api.post("/auth/refresh");
        return api(originalRequest);
      } catch (refreshError) {
        window.dispatchEvent(new CustomEvent(AXIOS_AUTH_ERROR_EVENT));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;