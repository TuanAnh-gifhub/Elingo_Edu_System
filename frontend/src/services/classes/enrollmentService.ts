import api from "../../config/axios";

export interface CreateEnrollmentRequest {
  classId: string;
  notes?: string;
}

export interface EnrollmentResponse {
  enrollmentId: string;
  studentId: string;
  studentName?: string;
  classId: string;
  className?: string;
  enrollmentDate?: string;
  createdAt?: string;
  updatedAt?: string;
  price?: number;
  paymentAmount?: number;
  paymentStatus?: string;
  paymentDate?: string;
  transactionId?: string;
}

export type QuizScoreAttemptRule =
  | "LATEST"
  | "HIGHEST"
  | "ATTEMPT_NUMBER";

export interface QuizScoreColumn {
  columnId: string;
  quizId: string;
  quizTitle?: string;
  columnName: string;
  attemptRule: QuizScoreAttemptRule;
  attemptNumber?: number;
}

export interface StudentQuizScoreRow {
  enrollmentId: string;
  studentId: string;
  studentName?: string;
  enrollmentDate?: string;
  paymentStatus?: string;
  quizScores: Record<string, number>;
}

export interface ClassQuizScoreMatrix {
  classId: string;
  columns: QuizScoreColumn[];
  rows: StudentQuizScoreRow[];
}

export interface UpdateQuizScoreColumnRequest {
  columnId?: string;
  quizId: string;
  columnName?: string;
  attemptRule: QuizScoreAttemptRule;
  attemptNumber?: number;
}

export const enrollmentService = {
  async createEnrollment(payload: CreateEnrollmentRequest): Promise<EnrollmentResponse> {
    const res = await api.post("/enrollments", payload);
    return res.data.result as EnrollmentResponse;
  },

  async checkEnrollment(classId: string): Promise<boolean> {
    const res = await api.get("/enrollments/check", { params: { classId } });
    return Boolean(res.data.result);
  },

  async getMyEnrollments(): Promise<EnrollmentResponse[]> {
    const res = await api.get("/enrollments/my");
    return (res.data.result || []) as EnrollmentResponse[];
  },

  async getClassEnrollments(classId: string): Promise<EnrollmentResponse[]> {
    const res = await api.get(`/enrollments/classes/${classId}`);
    return (res.data.result || []) as EnrollmentResponse[];
  },

  async getEnrollmentsByClassForAdmin(
    classId: string,
  ): Promise<EnrollmentResponse[]> {
    const res = await api.get(`/enrollments/classes/${classId}`);
    return (res.data.result || []) as EnrollmentResponse[];
  },

  async getClassQuizScoreMatrix(classId: string): Promise<ClassQuizScoreMatrix> {
    const res = await api.get(`/enrollments/classes/${classId}/quiz-score-matrix`);
    return res.data.result as ClassQuizScoreMatrix;
  },

  async updateClassQuizScoreColumns(
    classId: string,
    columns: UpdateQuizScoreColumnRequest[],
  ): Promise<ClassQuizScoreMatrix> {
    const res = await api.put(`/enrollments/classes/${classId}/quiz-score-columns`, {
      columns,
    });
    return res.data.result as ClassQuizScoreMatrix;
  },
};
