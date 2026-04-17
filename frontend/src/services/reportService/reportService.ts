import api from "../../config/axios";

export interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

export const reportService = {
  createReport: async (data: {
    title: string;
    content: string;
    email?: string;
    address?: string;
    roomName?: string;
    reportedId?: string;
  }) => {
    const res = await api.post<ApiResponse<null>>("/reports", data);
    return res.data;
  },

  getReportStatistics: async () => {
    return await api.get<ApiResponse<any>>("/reports/statistics");
  },

  getAllReports: (params: any) => {
    return api.get<ApiResponse<any>>("/reports", { params });
  },

  getRepportById: (reportId) => {
    return api.get<ApiResponse<any>>(`/reports/${reportId}`);
  },

  updateReport: (
    reportId: string,
    payload: {
      reportStatus: string;
      userName: string;
      email: string;
      content: string;
    },
  ) => {
    return api.put<ApiResponse<any>>(`/reports/${reportId}`, payload);
  },
};
