import api from "../../config/axios";

export interface ClassRoomDto {
  classId: string;
  className: string;
  description?: string;
  price: number;
  maxStudents?: number;
  currentStudents?: number;
  schedule?: string;
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

export const classRoomService = {
  async getClasses(page = 1, size = 10): Promise<ClassRoomPageResponse> {
    const res = await api.get("/classes", { params: { page, size } });
    return res.data.result as ClassRoomPageResponse;
  },

  async getClassById(id: string): Promise<ClassRoomDto> {
    const res = await api.get(`/classes/${id}`);
    return res.data.result as ClassRoomDto;
  },
};

