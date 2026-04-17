import api from "../../config/axios";

export interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
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

export interface CreateCommunityCommentRequest {
  postId: string;
  content: string;
  images: string[];
  videos: string[];
}

export interface UpdateCommunityCommentRequest {
  content: string;
  images: string[];
  videos: string[];
}

export type DeleteCommunityCommentResponse = string;
export type RestoreCommunityCommentResponse = string;

const commentService = {
  getCommentsByPostId: async (
    postId: string,
  ): Promise<ApiResponse<CommunityCommentResponse[]>> => {
    const response = await api.get<ApiResponse<CommunityCommentResponse[]>>(
      "/comments",
      {
        params: { postId },
      },
    );

    return response.data;
  },

  getHiddenCommentsByPostId: async (
    postId: string,
  ): Promise<ApiResponse<CommunityCommentResponse[]>> => {
    const response = await api.get<ApiResponse<CommunityCommentResponse[]>>(
      "/comments/hidden",
      {
        params: { postId },
      },
    );

    return response.data;
  },

  createComment: async (
    payload: CreateCommunityCommentRequest,
  ): Promise<ApiResponse<CommunityCommentResponse>> => {
    const response = await api.post<ApiResponse<CommunityCommentResponse>>(
      "/comments",
      payload,
    );

    return response.data;
  },

  updateComment: async (
    commentId: string,
    payload: UpdateCommunityCommentRequest,
  ): Promise<ApiResponse<CommunityCommentResponse>> => {
    const response = await api.put<ApiResponse<CommunityCommentResponse>>(
      `/comments/${commentId}`,
      payload,
    );

    return response.data;
  },

  deleteComment: async (
    commentId: string,
  ): Promise<ApiResponse<DeleteCommunityCommentResponse>> => {
    const response = await api.delete<
      ApiResponse<DeleteCommunityCommentResponse>
    >(`/comments/${commentId}`);

    return response.data;
  },

  restoreComment: async (
    commentId: string,
  ): Promise<ApiResponse<RestoreCommunityCommentResponse>> => {
    const response = await api.post<ApiResponse<RestoreCommunityCommentResponse>>(
      `/comments/${commentId}/restore`,
    );

    return response.data;
  },
};

export default commentService;
