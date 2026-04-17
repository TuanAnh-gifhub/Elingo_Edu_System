import api from "../../config/axios";

interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

export interface MeetingRecordingDto {
  recordingId: string;
  classId: string;
  roomName?: string;
  title?: string;
  recordingUrl?: string;
  status?: string;
  startedAt?: string;
  endedAt?: string;
  durationSeconds?: number;
  createdAt?: string;
}

export const meetingRecordingService = {
  async getStudentRecordings(classId: string): Promise<MeetingRecordingDto[]> {
    const res = await api.get<ApiResponse<MeetingRecordingDto[]>>(
      `/classes/${classId}/recordings/student`,
    );
    return res.data.result || [];
  },

  async getTeacherRecordings(classId: string): Promise<MeetingRecordingDto[]> {
    const res = await api.get<ApiResponse<MeetingRecordingDto[]>>(
      `/classes/${classId}/recordings/teacher`,
    );
    return res.data.result || [];
  },
};


