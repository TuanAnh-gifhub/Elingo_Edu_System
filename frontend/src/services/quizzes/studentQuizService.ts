import api from "../../config/axios";

export type StudentQuestionType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE";

export interface StudentQuizOption {
  optionId: string;
  optionText: string;
  orderIndex?: number;
}

export interface StudentQuizQuestion {
  questionId: string;
  questionText: string;
  questionType: StudentQuestionType;
  orderIndex?: number;
  options: StudentQuizOption[];
}

export interface StudentQuizTakeResponse {
  quizId: string;
  courseId: string;
  title: string;
  description?: string;
  maxAttempts: number;
  durationMinutes: number;
  attemptsUsed: number;
  attemptsRemaining: number;
  questions: StudentQuizQuestion[];
}

export interface SubmitQuizAnswerRequest {
  questionId: string;
  selectedOptionIds: string[];
}

export interface SubmitQuizRequest {
  answers: SubmitQuizAnswerRequest[];
}

export interface QuizSubmitQuestionResult {
  questionId: string;
  correct: boolean;
  selectedOptionIds: string[];
  correctOptionIds: string[];
}

export interface QuizSubmitResult {
  quizAttemptId: string;
  quizId: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  submittedAt: string;
  details: QuizSubmitQuestionResult[];
}

export interface QuizAttemptSummary {
  quizAttemptId: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  submittedAt: string;
}

export interface StudentQuizAttemptReviewOption {
  optionId: string;
  optionText: string;
  orderIndex?: number;
  selected: boolean;
  correct: boolean;
}

export interface StudentQuizAttemptReviewQuestion {
  questionId: string;
  questionText: string;
  questionType: StudentQuestionType;
  orderIndex?: number;
  correct: boolean;
  options: StudentQuizAttemptReviewOption[];
}

export interface StudentQuizAttemptReview {
  quizAttemptId: string;
  quizId: string;
  quizTitle: string;
  quizDescription?: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  submittedAt: string;
  questions: StudentQuizAttemptReviewQuestion[];
}

export const studentQuizService = {
  async getQuizForTake(quizId: string): Promise<StudentQuizTakeResponse> {
    const res = await api.get(`/student/quizzes/${quizId}/take`);
    return res.data.result as StudentQuizTakeResponse;
  },

  async submitQuiz(
    quizId: string,
    payload: SubmitQuizRequest,
  ): Promise<QuizSubmitResult> {
    const res = await api.post(`/student/quizzes/${quizId}/submit`, payload);
    return res.data.result as QuizSubmitResult;
  },

  async getMyAttempts(quizId: string): Promise<QuizAttemptSummary[]> {
    const res = await api.get(`/student/quizzes/${quizId}/my-attempts`);
    return (res.data.result || []) as QuizAttemptSummary[];
  },

  async getMyAttemptDetail(
    quizId: string,
    attemptId: string,
  ): Promise<StudentQuizAttemptReview> {
    const res = await api.get(`/student/quizzes/${quizId}/my-attempts/${attemptId}`);
    return res.data.result as StudentQuizAttemptReview;
  },
};


