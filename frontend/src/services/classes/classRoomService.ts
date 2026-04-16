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
  onlineOpen?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateClassOnlineStatusRequest {
  onlineOpen: boolean;
}

export interface OnlineClassAccessDto {
  classId: string;
  roomName: string;
  roomPassword: string;
  jwt?: string;
  tokenTtlSeconds?: number;
  onlineOpen: boolean;
  teacher: boolean;
}

export interface ClassWalletDto {
  classId: string;
  balance: number;
  claimable: boolean;
  endDate?: string;
  claimedAt?: string;
}

export interface ClassWalletTransactionDto {
  transactionId: string;
  transactionType: "CLASS_WALLET_IN" | "CLASS_WALLET_OUT" | string;
  amount: number;
  transactionTime?: string;
  studentName?: string;
  description?: string;
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
  poster?: string;
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
  poster?: string;
}

export interface ClassRoomPageResponse {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalElements: number;
  data: ClassRoomDto[];
}

export interface ClassRoomFilterParams {
  keyword?: string;
  teacherId?: string;
  minPrice?: number;
  maxPrice?: number;
  studyDay?: string;
  studyHour?: string;
}

export const classRoomService = {
  async getClasses(
    page = 1,
    size = 10,
    filters?: ClassRoomFilterParams,
  ): Promise<ClassRoomPageResponse> {
    const params: Record<string, string | number> = { page, size };

    if (filters?.keyword?.trim()) {
      params.keyword = filters.keyword.trim();
    }

    if (filters?.teacherId?.trim()) {
      params.teacherId = filters.teacherId.trim();
    }

    if (typeof filters?.minPrice === "number") {
      params.minPrice = filters.minPrice;
    }

    if (typeof filters?.maxPrice === "number") {
      params.maxPrice = filters.maxPrice;
    }

    if (filters?.studyDay?.trim()) {
      params.studyDay = filters.studyDay.trim();
    }

    if (filters?.studyHour?.trim()) {
      params.studyHour = filters.studyHour.trim();
    }

    const res = await api.get("/classes", { params });
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

  async updateOnlineStatus(
    classId: string,
    payload: UpdateClassOnlineStatusRequest,
  ): Promise<ClassRoomDto> {
    const res = await api.patch(`/classes/${classId}/online-status`, payload);
    return res.data.result as ClassRoomDto;
  },

  async getOnlineAccess(classId: string): Promise<OnlineClassAccessDto> {
    const res = await api.get(`/classes/${classId}/online-access`);
    return res.data.result as OnlineClassAccessDto;
  },

  async getClassWallet(classId: string): Promise<ClassWalletDto> {
    const res = await api.get(`/classes/${classId}/wallet`);
    return res.data.result as ClassWalletDto;
  },

  async claimClassWallet(classId: string): Promise<ClassWalletDto> {
    const res = await api.post(`/classes/${classId}/wallet/claim`);
    return res.data.result as ClassWalletDto;
  },

  async getClassWalletTransactions(
    classId: string,
  ): Promise<ClassWalletTransactionDto[]> {
    const res = await api.get(`/classes/${classId}/wallet/transactions`);
    return (res.data.result || []) as ClassWalletTransactionDto[];
  },

  async deleteClass(classId: string): Promise<string> {
    const res = await api.delete(`/classes/${classId}`);
    return res.data.result as string;
  },
};
