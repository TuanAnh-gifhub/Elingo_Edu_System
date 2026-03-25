import api from "../../config/axios";
import type { AxiosError } from "axios";

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

export type AssignmentQuestionType = "TEXT" | "MULTIPLE_CHOICE" | "AUDIO";
export type SubmissionStatus = "SUBMITTED" | "IN_REVIEW" | "GRADED";

export interface AssignmentQuestion {
  questionId: string;
  questionOrder: number;
  questionType: AssignmentQuestionType;
  questionContent: string;
  options?: string[];
  correctOptionIndex?: number;
  correctOptionIndexes?: number[];
  sampleAnswer?: string;
  maxScore: number;
}

export interface Assignment {
  assignmentId: string;
  classId: string;
  teacherId: string;
  teacherName: string;
  title: string;
  description?: string;
  deadline?: string;
  passwordRequired: boolean;
  maxAttempts?: number;
  timeLimitMinutes?: number;
  active: boolean;
  questions: AssignmentQuestion[];
  createdAt: string;
  updatedAt: string;
}

export interface SubmissionAnswerPayload {
  questionId: string;
  answerText?: string;
  selectedOptionIndex?: number;
  selectedOptionIndexes?: number[];
  audioFileId?: string;
}

export interface CreateSubmissionPayload {
  assignmentId: string;
  accessPassword?: string;
  attemptStartedAt?: string;
  autoSubmitted?: boolean;
  answers: SubmissionAnswerPayload[];
}

export interface SubmissionAnswer {
  answerId: string;
  questionId: string;
  questionOrder: number;
  questionType: AssignmentQuestionType;
  questionContent: string;
  answerText?: string;
  selectedOptionIndex?: number;
  selectedOptionIndexes?: number[];
  audioUrl?: string;
  transcriptText?: string;
  score?: number;
  feedback?: string;
  autoGraded: boolean;
}

export interface Submission {
  submissionId: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  attemptNumber: number;
  attemptStartedAt?: string;
  submittedAt: string;
  autoSubmitted?: boolean;
  status: SubmissionStatus;
  totalScore?: number;
  teacherFeedback?: string;
  answers: SubmissionAnswer[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssignmentQuestionPayload {
  questionOrder: number;
  questionType: AssignmentQuestionType;
  questionContent: string;
  options?: string[];
  correctOptionIndex?: number;
  correctOptionIndexes?: number[];
  sampleAnswer?: string;
  maxScore: number;
}

export interface CreateAssignmentPayload {
  classId: string;
  title: string;
  description?: string;
  deadline?: string;
  accessPassword?: string;
  maxAttempts?: number;
  timeLimitMinutes?: number;
  questions: CreateAssignmentQuestionPayload[];
}

export interface UpdateAssignmentPayload {
  title: string;
  description?: string;
  deadline?: string;
  clearDeadline?: boolean;
  accessPassword?: string;
  maxAttempts?: number;
  timeLimitMinutes?: number;
  clearTimeLimit?: boolean;
  active: boolean;
  questions: CreateAssignmentQuestionPayload[];
}

export interface GradeSubmissionAnswerPayload {
  answerId: string;
  score: number;
  feedback?: string;
}

export interface GradeSubmissionPayload {
  teacherFeedback?: string;
  answers: GradeSubmissionAnswerPayload[];
}

export interface AssignmentAudioResponse {
  audioFileId: string;
  audioUrl: string;
  transcriptText: string;
  mimeType?: string;
  durationSeconds?: number;
  fileSizeBytes?: number;
}

const ASSIGNMENT_ERROR_MAP: Array<{ match: string; message: string }> = [
  { match: "Ma tham gia nhom khong dung", message: "Ma nhom khong dung. Vui long thu lai." },
  { match: "Class join code is invalid", message: "Ma nhom khong dung. Vui long thu lai." },
  { match: "Nhom bai tap da du hoc vien", message: "Nhom bai tap da du hoc vien." },
  { match: "Class is full", message: "Nhom bai tap da du hoc vien." },
  { match: "Mat khau bai tap khong dung", message: "Mat khau bai tap khong dung." },
  { match: "Assignment password is invalid", message: "Mat khau bai tap khong dung." },
  { match: "Ban chua tham gia nhom bai tap cua lop nay", message: "Ban chua tham gia nhom bai tap cua lop nay." },
  { match: "must join this class", message: "Ban chua tham gia nhom bai tap cua lop nay." },
  { match: "Bai tap da het han nop", message: "Bai tap da het han." },
  { match: "Submission attempt limit exceeded", message: "Ban da het so lan lam bai cho bai tap nay." },
  { match: "You do not have permission for this submission", message: "Ban khong co quyen thao tac bai nop nay." },
  { match: "You do not have permission for this assignment", message: "Ban khong co quyen thao tac bai tap nay." },
  { match: "Cau truc CSDL chua cap nhat", message: "He thong dang cap nhat du lieu. Vui long thu lai sau it phut." },
  { match: "Uncategorized error", message: "He thong dang ban. Vui long thu lai sau." },
];

export const resolveAssignmentErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  const apiError = error as AxiosError<{ message?: string }>;
  const serverMessage = apiError.response?.data?.message || "";

  for (const item of ASSIGNMENT_ERROR_MAP) {
    if (serverMessage.includes(item.match)) {
      return item.message;
    }
  }

  return serverMessage || fallback;
};

const assignmentService = {
  async getAssignments(params?: {
    page?: number;
    size?: number;
    classId?: string;
    teacherId?: string;
    keyword?: string;
    deadlineFrom?: string;
    deadlineTo?: string;
    active?: boolean;
  }): Promise<PageResponse<Assignment>> {
    const response = await api.get<ApiResponse<PageResponse<Assignment>>>(
      "/assignments",
      { params },
    );
    return response.data.result;
  },

  async getAssignmentById(assignmentId: string): Promise<Assignment> {
    const response = await api.get<ApiResponse<Assignment>>(
      `/assignments/${assignmentId}`,
    );
    return response.data.result;
  },

  async createAssignment(payload: CreateAssignmentPayload): Promise<Assignment> {
    const response = await api.post<ApiResponse<Assignment>>(
      "/assignments",
      payload,
    );
    return response.data.result;
  },

  async updateAssignment(
    assignmentId: string,
    payload: UpdateAssignmentPayload,
  ): Promise<Assignment> {
    const response = await api.put<ApiResponse<Assignment>>(
      `/assignments/${assignmentId}`,
      payload,
    );
    return response.data.result;
  },

  async deleteAssignment(assignmentId: string): Promise<void> {
    await api.delete(`/assignments/${assignmentId}`);
  },

  async startAssignment(
    assignmentId: string,
    accessPassword?: string,
  ): Promise<void> {
    await api.post(`/assignments/${assignmentId}/start`, { accessPassword });
  },

  async createSubmission(payload: CreateSubmissionPayload): Promise<Submission> {
    const response = await api.post<ApiResponse<Submission>>(
      "/submissions",
      payload,
    );
    return response.data.result;
  },

  async getSubmission(submissionId: string): Promise<Submission> {
    const response = await api.get<ApiResponse<Submission>>(
      `/submissions/${submissionId}`,
    );
    return response.data.result;
  },

  async getLatestMySubmissionByAssignment(
    assignmentId: string,
  ): Promise<Submission | null> {
    const response = await api.get<ApiResponse<Submission | null>>(
      `/submissions/latest/by-assignment/${assignmentId}`,
    );
    return response.data.result || null;
  },

  async getLatestMySubmissionsByAssignments(
    assignmentIds: string[],
  ): Promise<Record<string, Submission>> {
    if (!assignmentIds.length) {
      return {};
    }

    const response = await api.get<ApiResponse<Record<string, Submission>>>(
      "/submissions/latest/by-assignments",
      {
        params: { assignmentIds },
      },
    );
    return response.data.result || {};
  },

  async getSubmissionsByAssignment(
    assignmentId: string,
    page = 1,
    size = 10,
  ): Promise<PageResponse<Submission>> {
    const response = await api.get<ApiResponse<PageResponse<Submission>>>(
      `/assignments/${assignmentId}/submissions`,
      {
        params: { page, size },
      },
    );
    return response.data.result;
  },

  async gradeSubmission(
    submissionId: string,
    payload: GradeSubmissionPayload,
  ): Promise<Submission> {
    const response = await api.patch<ApiResponse<Submission>>(
      `/submissions/${submissionId}/grade`,
      payload,
    );
    return response.data.result;
  },

  async uploadAudio(file: Blob | File): Promise<AssignmentAudioResponse> {
    const formData = new FormData();
    const uploadFile = file instanceof File ? file : new File([file], `recording-${Date.now()}.webm`, { type: file.type || "audio/webm" });
    formData.append("file", uploadFile);

    const response = await api.post<ApiResponse<AssignmentAudioResponse>>(
      "/assignments/audio",
      formData,
    );
    return response.data.result;
  },
};

export default assignmentService;

