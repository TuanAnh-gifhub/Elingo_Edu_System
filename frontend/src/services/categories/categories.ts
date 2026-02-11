import api from "../../config/axios";

export interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

export interface CategoryResponse {
  categoryId: number;
  categoryName: string;
}

export interface CreateCategoryRequest {
  categoryName: string;
}

export interface UpdateCategoryRequest {
  categoryName: string;
}

const categoriesService = {
  getAllCategories: async (): Promise<ApiResponse<CategoryResponse[]>> => {
    const response = await api.get<ApiResponse<CategoryResponse[]>>("/categories");
    return response.data;
  },

  getCategoryById: async (id: number): Promise<ApiResponse<CategoryResponse>> => {
    const response = await api.get<ApiResponse<CategoryResponse>>(`/categories/${id}`);
    return response.data;
  },

  createCategory: async (payload: CreateCategoryRequest): Promise<ApiResponse<CategoryResponse>> => {
    const response = await api.post<ApiResponse<CategoryResponse>>("/categories", payload);
    return response.data;
  },

  updateCategory: async (
    id: number,
    payload: UpdateCategoryRequest
  ): Promise<ApiResponse<CategoryResponse>> => {
    const response = await api.put<ApiResponse<CategoryResponse>>(`/categories/${id}`, payload);
    return response.data;
  },

  deleteCategory: async (id: number): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/categories/${id}`);
    return response.data;
  },
};

export default categoriesService;
