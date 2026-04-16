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

  async getEnrollmentsByClassForAdmin(classId: string): Promise<EnrollmentResponse[]> {
    const res = await api.get(`/enrollments/admin/class/${classId}`);
  async getClassEnrollments(classId: string): Promise<EnrollmentResponse[]> {
    const res = await api.get(`/enrollments/classes/${classId}`);
    return (res.data.result || []) as EnrollmentResponse[];
  },
};
