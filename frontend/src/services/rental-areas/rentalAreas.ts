import api from "../../config/axios";

export interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

export type RentalAreaStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export interface UpdateRentalAreaStatusRequest {
  status: "ACTIVE" | "INACTIVE"; 
}

export interface RentalAreaImageResponse {
  rentalAreaImageId: string;
  imageUrl: string;
  isCover: boolean;
  sortOrder: number | null;
}

export interface RentalAreaResponse {
  rentalAreaId: string;
  rentalAreaName: string;
  address: string;
  contactName?: string;
  contactPhone?: string;
  status: RentalAreaStatus;
  cityId: number;   
  cityName: string;   
  images: RentalAreaImageResponse[];
}


export interface CreateRentalAreaRequest {
  rentalAreaName: string;
  address: string;
  contactName?: string;
  contactPhone?: string;
  cityId: number; 
  images: File[];
}

export interface UpdateRentalAreaRequest {
  rentalAreaName: string;
  address: string;
  contactName?: string;
  contactPhone?: string;
  cityId: number;
}


const rentalAreasService = {
  createRentalArea: async (
    data: CreateRentalAreaRequest,
  ): Promise<ApiResponse<RentalAreaResponse>> => {
    const formData = new FormData();
    formData.append("rentalAreaName", data.rentalAreaName);
    formData.append("address", data.address);
    if (data.contactName) formData.append("contactName", data.contactName);
    if (data.contactPhone) formData.append("contactPhone", data.contactPhone);
    formData.append("cityId", String(data.cityId));

    data.images.forEach((file) => {
      formData.append("images", file); 
    });

    const response = await api.post<ApiResponse<RentalAreaResponse>>(
      "/rental-areas",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );

    return response.data;
  },

  getMyRentalAreas: async (): Promise<ApiResponse<RentalAreaResponse[]>> => {
    const response = await api.get<ApiResponse<RentalAreaResponse[]>>(
      "/rental-areas/my-rental-areas",
    );
    return response.data;
  },

  deleteRentalArea: async (rentalAreaId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(
      `/rental-areas/${rentalAreaId}`,
    );
    return response.data;
  },

  updateRentalAreaStatus: async (
    rentalAreaId: string,
    status: "ACTIVE" | "INACTIVE",
  ): Promise<ApiResponse<any>> => {
    const payload: UpdateRentalAreaStatusRequest = { status };
    const response = await api.patch<ApiResponse<any>>(
      `/rental-areas/${rentalAreaId}/status`,
      payload,
    );
    return response.data;
  },

  updateRentalArea: async (
    rentalAreaId: string,
    data: UpdateRentalAreaRequest,
  ): Promise<ApiResponse<RentalAreaResponse>> => {
    const response = await api.put<ApiResponse<RentalAreaResponse>>(
      `/rental-areas/${rentalAreaId}`,
      data,
    );
    return response.data;
  },

};

export default rentalAreasService;
