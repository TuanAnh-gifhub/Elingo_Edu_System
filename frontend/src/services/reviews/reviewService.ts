import api from "../../config/axios";

export interface ReviewDto {
  id: string;
  classId?: string;
  className?: string;
  rating: number;
  comment: string;
  userName: string;
  userAvatar?: string;
  createdAt: string;
}

export interface ReviewSummaryDto {
  averageRating: number;
  totalReviews: number;
}

export interface ReviewPageDto {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalElements: number;
  data: ReviewDto[];
}

interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

export interface CreateReviewPayload {
  rating: number;
  comment: string;
}

export const reviewService = {
  async createClassReview(
    classId: string,
    payload: CreateReviewPayload,
  ): Promise<ReviewDto> {
    const response = await api.post<ApiResponse<ReviewDto>>("/reviews", payload, {
      params: { classId },
    });
    return response.data.result;
  },

  async getClassReviews(
    classId: string,
    page = 0,
    size = 10,
  ): Promise<ReviewPageDto> {
    const response = await api.get<ApiResponse<ReviewPageDto>>(
      `/reviews/class/${classId}`,
      {
        params: { page, size },
      },
    );
    return response.data.result;
  },

  async getClassReviewSummary(classId: string): Promise<ReviewSummaryDto> {
    const response = await api.get<ApiResponse<ReviewSummaryDto>>(
      `/reviews/class/${classId}/summary`,
    );
    return response.data.result;
  },

  async getGlobalReviews(page = 0, size = 20): Promise<ReviewPageDto> {
    const response = await api.get<ApiResponse<ReviewPageDto>>("/reviews/global", {
      params: { page, size },
    });
    return response.data.result;
  },

  async getAdminReviews(page = 0, size = 20): Promise<ReviewPageDto> {
    const response = await api.get<ApiResponse<ReviewPageDto>>(
      "/reviews/admin/all",
      {
        params: { page, size },
      },
    );
    return response.data.result;
  },
};

