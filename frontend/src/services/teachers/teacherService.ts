import api from "../../config/axios";

export interface TeacherProfileDto {
  teacherId: string;
  teacherName: string;
  avatar: string;
  averageRating: number;
  totalReviews: number;
}

export type TeacherVerificationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface TeacherVerificationRequestPayload {
  fullName: string;
  phone?: string;
  bio: string;
  expertise: string;
  experience: string;
  certificateFiles: string[];
  portfolioLink?: string;
}

export interface TeacherVerificationReviewPayload {
  status: TeacherVerificationStatus;
  adminNote?: string;
}

export interface TeacherVerificationResponse {
  id: string;
  userId: string;
  role?: string;
  fullName: string;
  email: string;
  phone: string;
  bio: string;
  expertise: string;
  experience: string;
  certificateFiles: string[];
  portfolioLink?: string;
  status: TeacherVerificationStatus;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

export const teacherService = {
  async getTopTeachers(limit = 8): Promise<TeacherProfileDto[]> {
    const response = await api.get("/users/teachers/public", {
      params: { limit },
    });
    return (response.data?.result || []) as TeacherProfileDto[];
  },

  async uploadCertificate(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post<ApiResponse<string>>(
      "/teacher-verification/upload-certificate",
      formData,
    );

    return response.data.result;
  },

  async uploadCertificates(files: File[]): Promise<string[]> {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    const response = await api.post<ApiResponse<string[]>>(
      "/teacher-verification/upload-certificates",
      formData,
    );

    return response.data.result || [];
  },

  async submitVerificationRequest(
    payload: TeacherVerificationRequestPayload,
  ): Promise<TeacherVerificationResponse> {
    const response = await api.post<ApiResponse<TeacherVerificationResponse>>(
      "/teacher-verification/request",
      payload,
    );
    return response.data.result;
  },

  async getMyVerificationRequest(): Promise<TeacherVerificationResponse | null> {
    const response = await api.get<ApiResponse<TeacherVerificationResponse | null>>(
      "/teacher-verification/my-request",
    );
    return response.data.result || null;
  },

  async getAllVerificationRequests(): Promise<TeacherVerificationResponse[]> {
    const response = await api.get<ApiResponse<TeacherVerificationResponse[]>>(
      "/admin/teacher-verification",
    );
    return response.data.result || [];
  },

  async getVerificationRequestById(
    id: string,
  ): Promise<TeacherVerificationResponse> {
    const response = await api.get<ApiResponse<TeacherVerificationResponse>>(
      `/admin/teacher-verification/${id}`,
    );
    return response.data.result;
  },

  async reviewVerificationRequest(
    id: string,
    payload: TeacherVerificationReviewPayload,
  ): Promise<TeacherVerificationResponse> {
    const response = await api.put<ApiResponse<TeacherVerificationResponse>>(
      `/admin/teacher-verification/${id}/review`,
      payload,
    );
    return response.data.result;
  },

  async approveVerificationRequest(id: string): Promise<TeacherVerificationResponse> {
    const response = await api.put<ApiResponse<TeacherVerificationResponse>>(
      `/admin/teacher-verification/${id}/approve`,
    );
    return response.data.result;
  },

  async rejectVerificationRequest(
    id: string,
    adminNote: string,
  ): Promise<TeacherVerificationResponse> {
    const response = await api.put<ApiResponse<TeacherVerificationResponse>>(
      `/admin/teacher-verification/${id}/reject`,
      { adminNote },
    );
    return response.data.result;
  },
};
