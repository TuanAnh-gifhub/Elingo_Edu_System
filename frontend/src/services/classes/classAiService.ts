import api from "../../config/axios";

export interface ClassAiHistoryMessageResponse {
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
}

export interface ClassAiChatResponse {
  answer: string;
  sources?: string[];
}

export const classAiService = {
  async chat(classId: string, message: string): Promise<ClassAiChatResponse> {
    const res = await api.post(`/classes/${classId}/ai/chat`, { message });
    return res.data.result as ClassAiChatResponse;
  },

  async getHistory(classId: string): Promise<ClassAiHistoryMessageResponse[]> {
    const res = await api.get(`/classes/${classId}/ai/history`);
    return (res.data.result || []) as ClassAiHistoryMessageResponse[];
  },
};
