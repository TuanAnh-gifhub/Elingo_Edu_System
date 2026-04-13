import api from "../../config/axios";

export interface ReviewDto {
  id: string;
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

export interface CreateReviewPayload {
  rating: number;
  comment: string;
}

export const reviewService = {
  async createTeacherReview(
	teacherId: string,
	payload: CreateReviewPayload,
  ): Promise<ReviewDto> {
	const response = await api.post("/reviews", payload, {
	  params: { teacherId },
	});
	return response.data.result as ReviewDto;
  },

  async getTeacherReviews(
	teacherId: string,
	page = 0,
	size = 10,
  ): Promise<ReviewPageDto> {
	const response = await api.get(`/reviews/teacher/${teacherId}`, {
	  params: { page, size },
	});
	return response.data.result as ReviewPageDto;
  },

  async getTeacherReviewSummary(teacherId: string): Promise<ReviewSummaryDto> {
	const response = await api.get(`/reviews/teacher/${teacherId}/summary`);
	return response.data.result as ReviewSummaryDto;
  },
};

