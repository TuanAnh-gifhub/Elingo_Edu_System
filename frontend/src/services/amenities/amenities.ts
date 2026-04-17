import api from "../../config/axios";

export interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

export interface AmenityResponse {
  amenityId: number;
  amenityName: string;
  iconKey: string;
}

export interface CreateAmenityRequest {
  amenityName: string;
  iconKey: string;
}

export interface UpdateAmenityRequest {
  amenityName: string;
  iconKey: string;
}

const amenitiesService = {
  getAllAmenities: async (): Promise<ApiResponse<AmenityResponse[]>> => {
    const response = await api.get<ApiResponse<AmenityResponse[]>>("/amenities");
    return response.data;
  },

  getAmenityById: async (id: number): Promise<ApiResponse<AmenityResponse>> => {
    const response = await api.get<ApiResponse<AmenityResponse>>(`/amenities/${id}`);
    return response.data;
  },

  createAmenity: async (payload: CreateAmenityRequest): Promise<ApiResponse<AmenityResponse>> => {
    const response = await api.post<ApiResponse<AmenityResponse>>("/amenities", payload);
    return response.data;
  },

  updateAmenity: async (
    id: number,
    payload: UpdateAmenityRequest
  ): Promise<ApiResponse<AmenityResponse>> => {
    const response = await api.put<ApiResponse<AmenityResponse>>(`/amenities/${id}`, payload);
    return response.data;
  },

  deleteAmenity: async (id: number): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/amenities/${id}`);
    return response.data;
  },
};

export default amenitiesService;
