import api from "../../config/axios";

export interface TeacherProfileDto {
  teacherId: string;
  teacherName: string;
  avatar: string;
  averageRating: number;
  totalReviews: number;
}

export const teacherService = {
  async getTopTeachers(limit = 8): Promise<TeacherProfileDto[]> {
    const response = await api.get("/users/teachers/public", {
      params: { limit },
    });
    return (response.data?.result || []) as TeacherProfileDto[];
  },
};

