import api from "../../config/axios";

export interface QuizDto {
  quizId: string;
  courseId: string;
  title: string;
  description: string;
  maxAttempts: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateQuizRequest {
  courseId: string;
  title: string;
  description: string;
  maxAttempts: number;
}

export interface UpdateQuizRequest {
  title: string;
  description: string;
  maxAttempts: number;
}

export interface QuizPageResponse {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalElements: number;
  data: QuizDto[];
}

export interface QuizImportResult {
  importedCount: number;
  totalRows: number;
  errors: string[];
}

export const quizService = {
  async getQuiz(quizId: string): Promise<QuizDto> {
    const res = await api.get(`/quizzes/${quizId}`);
    return res.data.result as QuizDto;
  },

  async getQuizzes(page = 1, size = 10): Promise<QuizPageResponse> {
    const res = await api.get("/quizzes", { params: { page, size } });
    return res.data.result as QuizPageResponse;
  },

  async createQuiz(payload: CreateQuizRequest): Promise<QuizDto> {
    const res = await api.post("/quizzes", payload);
    return res.data.result as QuizDto;
  },

  async updateQuiz(
    quizId: string,
    payload: UpdateQuizRequest,
  ): Promise<QuizDto> {
    const res = await api.put(`/quizzes/${quizId}`, payload);
    return res.data.result as QuizDto;
  },

  async deleteQuiz(quizId: string): Promise<void> {
    await api.delete(`/quizzes/${quizId}`);
  },

  async importQuizExcel(quizId: string, file: File): Promise<QuizImportResult> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await api.post(`/quizzes/${quizId}/import-excel`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return res.data.result as QuizImportResult;
  },
};
