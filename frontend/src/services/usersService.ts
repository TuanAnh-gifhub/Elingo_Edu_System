import api from "../config/axios";

// 1. Định nghĩa Interface khớp 100% với UserResponse.java
export interface UserResponse {
  userId: string; // UUID bên Java -> string bên TS
  userName: string;
  fullName: string;
  email: string;
  gender: string;
  phone: string;
  dateOfBirth: string; // LocalDate -> string (dạng "2000-01-01")
  age: number; // int -> number
  role: string; // Enum Role -> string (VD: "ADMIN", "USER")
  createdAt: string; // LocalDateTime -> string (ISO format)
  updatedAt: string; // LocalDateTime -> string
  active: boolean; // boolean -> boolean
}

// 2. Định nghĩa Wrapper (ApiResponse) giống cấu trúc JSON trả về của Backend
export interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

export const userService = {
  getMe: () => {
    return api.get<any, ApiResponse<UserResponse>>("/users/profile");
  },
};
