import api from "../../config/axios";

export interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

export interface PageResponse<T> {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalElements: number;
  data: T[];
}

export interface CommunityCommentResponse {
  commentId: string;
  authorId: string;
  authorName: string;
  content: string;
  images: string[];
  videos: string[];
  likeCount: number;
  parentCommentId: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityPostResponse {
  postId: string;
  authorId: string;
  authorName: string;
  content: string;
  images: string[];
  videos: string[];
  likeCount: number;
  commentCount: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  comments: CommunityCommentResponse[];
}

export interface CreateCommunityPostRequest {
  content: string;
  images: string[];
  videos: string[];
}

export interface UpdateCommunityPostRequest {
  content: string;
  images: string[];
  videos: string[];
}

export type DeleteCommunityPostResponse = string;

const communityService = {
  getPosts: async (
    page: number = 0,
    size: number = 10,
  ): Promise<ApiResponse<PageResponse<CommunityPostResponse>>> => {
    const response = await api.get<
      ApiResponse<PageResponse<CommunityPostResponse>>
    >("/posts", {
      params: { page, size },
    });

    return response.data;
  },

  createPost: async (
    payload: CreateCommunityPostRequest,
  ): Promise<ApiResponse<CommunityPostResponse>> => {
    const response = await api.post<ApiResponse<CommunityPostResponse>>(
      "/posts",
      payload,
    );

    return response.data;
  },

  updatePost: async (
    postId: string,
    payload: UpdateCommunityPostRequest,
  ): Promise<ApiResponse<CommunityPostResponse>> => {
    const response = await api.put<ApiResponse<CommunityPostResponse>>(
      `/posts/${postId}`,
      payload,
    );

    return response.data;
  },

  deletePost: async (
    postId: string,
  ): Promise<ApiResponse<DeleteCommunityPostResponse>> => {
    const response = await api.delete<ApiResponse<DeleteCommunityPostResponse>>(
      `/posts/${postId}`,
    );

    return response.data;
  },
};

export default communityService;
