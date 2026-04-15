// postService.ts — Real API service (không còn mock data)
// Dùng communityService.ts cho CommunityPage; file này để tương thích nếu cần

import api from "../config/axios";

export const PostStatus = {
  DRAFT: "DRAFT",
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type PostStatusType = (typeof PostStatus)[keyof typeof PostStatus];

export interface Post {
  postId: string;
  authorId?: string;
  authorName?: string;
  content: string;
  images?: string[];
  videos?: string[];
  likeCount?: number;
  commentCount?: number;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
  isLiked?: boolean;
}

export interface CreatePostRequest {
  content: string;
  images?: string[];
  videos?: string[];
}

export interface UpdatePostRequest {
  content?: string;
  images?: string[];
  videos?: string[];
}

interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

interface PageResponse<T> {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalElements: number;
  data: T[];
}

export const postService = {
  getPosts: (page = 1, size = 10) =>
    api
      .get<ApiResponse<PageResponse<Post>>>("/posts", { params: { page, size } })
      .then((r) => r.data),

  getPostById: (postId: string) =>
    api
      .get<ApiResponse<Post>>(`/posts/${postId}`)
      .then((r) => r.data),

  createPost: (data: CreatePostRequest) =>
    api
      .post<ApiResponse<Post>>("/posts", data)
      .then((r) => r.data),

  updatePost: (postId: string, data: UpdatePostRequest) =>
    api
      .put<ApiResponse<Post>>(`/posts/${postId}`, data)
      .then((r) => r.data),

  deletePost: (postId: string) =>
    api
      .delete<ApiResponse<void>>(`/posts/${postId}`)
      .then((r) => r.data),

  likePost: (postId: string) =>
    api
      .post<ApiResponse<void>>(`/posts/${postId}/like`)
      .then((r) => r.data),
};
