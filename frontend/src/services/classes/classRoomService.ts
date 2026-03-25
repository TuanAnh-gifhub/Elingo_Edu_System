import api from "../../config/axios";

export interface ClassRoomDto {
  classId: string;
  className: string;
  description?: string;
  teacherId?: string;
  teacherName?: string;
  price: number;
  maxStudents?: number;
  currentStudents?: number;
  schedule?: string;
  joinCodeRequired?: boolean;
  active: boolean;
  poster?: string;
}

export interface ClassRoomPageResponse {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalElements: number;
  data: ClassRoomDto[];
}

export interface GetClassesParams {
  keyword?: string;
  teacherId?: string;
  active?: boolean;
}

export interface UpdateClassRoomPayload {
  className?: string;
  description?: string;
  teacherId?: string;
  price?: number;
  startDate?: string;
  endDate?: string;
  maxStudents?: number;
  schedule?: string;
  joinCode?: string;
  joinCodeRequired?: boolean;
  active?: boolean;
}

export interface CreateClassRoomPayload {
  className: string;
  description?: string;
  teacherId: string;
  price: number;
  maxStudents?: number;
  schedule?: string;
  joinCode?: string;
  joinCodeRequired?: boolean;
}

export const classRoomService = {
  async getClasses(
    page = 1,
    size = 10,
    filters?: GetClassesParams,
  ): Promise<ClassRoomPageResponse> {
    const res = await api.get("/classes", { params: { page, size, ...(filters || {}) } });
    return res.data.result as ClassRoomPageResponse;
  },

  async getClassById(id: string): Promise<ClassRoomDto> {
    const res = await api.get(`/classes/${id}`);
    return res.data.result as ClassRoomDto;
  },

  async createClass(payload: CreateClassRoomPayload): Promise<ClassRoomDto> {
    const res = await api.post("/classes", payload);
    return res.data.result as ClassRoomDto;
  },

  async updateClass(classId: string, payload: UpdateClassRoomPayload): Promise<void> {
    await api.put(`/classes/${classId}`, payload);
  },

  async joinClass(classId: string, joinCode?: string): Promise<void> {
    await api.post(`/classes/${classId}/join`, { joinCode });
  },

  async getJoinedClassIds(): Promise<string[]> {
    const res = await api.get("/classes/joined-ids");
    return (res.data.result || []) as string[];
  },
};

