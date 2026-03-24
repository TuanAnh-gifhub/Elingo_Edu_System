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

export type AssignmentQuestionType = "TEXT" | "MULTIPLE_CHOICE" | "AUDIO";
export type SubmissionStatus = "SUBMITTED" | "IN_REVIEW" | "GRADED";

export interface AssignmentQuestion {
  questionId: string;
  questionOrder: number;
  questionType: AssignmentQuestionType;
  questionContent: string;
  options?: string[];
  correctOptionIndex?: number;
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

