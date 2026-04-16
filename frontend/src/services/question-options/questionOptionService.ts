import api from "../../config/axios";

export interface QuestionOptionDto {
  optionId: string;
  questionId: string;
  optionText: string;
  isCorrect: boolean;
  orderIndex: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateQuestionOptionRequest {
  questionId: string;
  optionText: string;
  isCorrect: boolean;
  orderIndex: number;
}

export interface UpdateQuestionOptionRequest {
  optionText: string;
  isCorrect: boolean;
  orderIndex: number;
}

export const questionOptionService = {
  async createOption(
    payload: CreateQuestionOptionRequest,
  ): Promise<QuestionOptionDto> {
    const res = await api.post("/question-options", payload);
    return res.data.result as QuestionOptionDto;
  },

  async updateOption(
    optionId: string,
    payload: UpdateQuestionOptionRequest,
  ): Promise<QuestionOptionDto> {
    const res = await api.put(`/question-options/${optionId}`, payload);
    return res.data.result as QuestionOptionDto;
  },

  async deleteOption(optionId: string): Promise<void> {
    await api.delete(`/question-options/${optionId}`);
  },
};
