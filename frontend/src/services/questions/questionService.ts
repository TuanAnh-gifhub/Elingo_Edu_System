import api from "../../config/axios";
import type { QuestionOptionDto } from "../question-options/questionOptionService";

export type QuestionType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE";

export interface QuestionDto {
  questionId: string;
  quizId: string;
  questionText: string;
  questionType: QuestionType;
  orderIndex: number;
  options?: QuestionOptionDto[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateQuestionRequest {
  quizId: string;
  questionText: string;
  questionType: QuestionType;
  orderIndex: number;
}

export interface UpdateQuestionRequest {
  questionText: string;
  questionType: QuestionType;
  orderIndex: number;
}

export const questionService = {
  async getQuestions(quizId?: string): Promise<QuestionDto[]> {
    const res = await api.get("/questions", {
      params: quizId ? { quizId } : undefined,
    });
    return (res.data.result || []) as QuestionDto[];
  },

  async createQuestion(payload: CreateQuestionRequest): Promise<QuestionDto> {
    const res = await api.post("/questions", payload);
    return res.data.result as QuestionDto;
  },

  async updateQuestion(
    questionId: string,
    payload: UpdateQuestionRequest,
  ): Promise<QuestionDto> {
    const res = await api.put(`/questions/${questionId}`, payload);
    return res.data.result as QuestionDto;
  },

  async deleteQuestion(questionId: string): Promise<void> {
    await api.delete(`/questions/${questionId}`);
  },
};
