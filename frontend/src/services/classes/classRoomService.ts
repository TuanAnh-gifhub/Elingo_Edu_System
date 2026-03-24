import api from "../../config/axios";

export interface ClassRoomDto {
  classId: string;
  className: string;
  description?: string;
  teacherId?: string;
  teacherName?: string;
  teacherEmail?: string;
  price: number;
  startDate?: string;
  endDate?: string;
  maxStudents?: number;
  currentStudents?: number;
  schedule?: string;
  active: boolean;
  poster?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateClassRoomRequest {
  className: string;
  description: string;
  teacherId: string;
  price: number;
  startDate: string;
  endDate: string;
  maxStudents: number;
  schedule: string;
}

export interface UpdateClassRoomRequest {
  className: string;
  description: string;
  teacherId: string;
  price: number;
  startDate: string;
  endDate: string;
  maxStudents: number;
  schedule: string;
}

export interface ClassRoomPageResponse {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalElements: number;
  data: ClassRoomDto[];
}

export const classRoomService = {
  async getClasses(page = 1, size = 10): Promise<ClassRoomPageResponse> {
    const res = await api.get("/classes", { params: { page, size } });
    return res.data.result as ClassRoomPageResponse;
  },

  async getClassById(id: string): Promise<ClassRoomDto> {
    const res = await api.get(`/classes/${id}`);
    return res.data.result as ClassRoomDto;
  },

  async createClass(payload: CreateClassRoomRequest): Promise<ClassRoomDto> {
    const res = await api.post("/classes", payload);
    return res.data.result as ClassRoomDto;
  },

  async updateClass(
    classId: string,
    payload: UpdateClassRoomRequest,
  ): Promise<ClassRoomDto> {
    const res = await api.put(`/classes/${classId}`, payload);
    return res.data.result as ClassRoomDto;
  },

  async deleteClass(classId: string): Promise<string> {
    const res = await api.delete(`/classes/${classId}`);
    return res.data.result as string;
  },
};
