import api from "../../config/axios";

export interface CourseDto {
  courseId: string;
  classId: string;
  title: string;
  description?: string;
  orderIndex: number;
  fileUrls: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCourseRequest {
  classId: string;
  title: string;
  description: string;
  orderIndex: number;
  fileUrls: string[];
}

export interface CoursePageResponse {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalElements: number;
  data: CourseDto[];
}

export interface UpdateCourseRequest {
  classId: string;
  title: string;
  description: string;
  orderIndex: number;
  fileUrls: string[];
}

export const courseService = {
  async getCourses(
    page = 1,
    size = 50,
    classId?: string,
  ): Promise<CoursePageResponse> {
    const params: Record<string, string | number> = { page, size };
    if (classId) {
      params.classId = classId;
    }

    const res = await api.get("/courses", { params });
    return res.data.result as CoursePageResponse;
  },

  async createCourse(payload: CreateCourseRequest): Promise<CourseDto> {
    const res = await api.post("/courses", payload);
    return res.data.result as CourseDto;
  },

  async updateCourse(
    courseId: string,
    payload: UpdateCourseRequest,
  ): Promise<CourseDto> {
    const res = await api.put(`/courses/${courseId}`, payload);
    return res.data.result as CourseDto;
  },

  async deleteCourse(courseId: string): Promise<string> {
    const res = await api.delete(`/courses/${courseId}`);
    return res.data.result as string;
  },
};
