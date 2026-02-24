import api from "../../config/axios";

export interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

export interface CreateRoomRequest {
  roomName: string;
  description?: string;
  price?: number;
  capacity?: number;
  area?: number;
  categoryId?: number;
  amenityIds?: number[];
  images: File[]; 
}

export type RoomStatus = "ACTIVE" | "HIDDEN" | "INACTIVE" | string;

export interface RoomCardResponse {
  roomId: string;
  rentalAreaId: string;
  roomName: string;
  roomStatus: RoomStatus;
  coverImageUrl?: string | null;
  price?: number | null;
  capacity?: number | null;
}

export interface RoomImageResponse {
  roomImageId: string;
  imageUrl: string;
  isCover?: boolean;
  sortOrder?: number;
}

export interface AmenityItem {
  amenityId: number;
  amenityName: string;
}

export interface RoomResponse {
  roomId: string;
  rentalAreaId: string;
  roomName: string;
  description?: string | null;
  price?: number | null;
  roomStatus: RoomStatus;
  capacity?: number | null;
  area?: number | null;
  categoryId?: number | null;
  categoryName?: string | null;
  amenities?: AmenityItem[];
  images?: RoomImageResponse[];
}

export interface UpdateRoomRequest {
  roomName?: string;
  description?: string;
  price?: number;
  capacity?: number;
  area?: number;
  categoryId?: number;
  amenityIds?: number[];
  replaceImages?: boolean;
}

const roomsService = {

  createRoom: async (rentalAreaId: string, payload: CreateRoomRequest): Promise<ApiResponse<RoomResponse>> => {
  const formData = new FormData();

  formData.append("roomName", payload.roomName);

  if (payload.description) formData.append("description", payload.description);
  if (payload.price !== undefined && payload.price !== null) formData.append("price", String(payload.price));
  if (payload.capacity !== undefined && payload.capacity !== null) formData.append("capacity", String(payload.capacity));
  if (payload.area !== undefined && payload.area !== null) formData.append("area", String(payload.area));
  if (payload.categoryId !== undefined && payload.categoryId !== null) formData.append("categoryId", String(payload.categoryId));

  if (payload.amenityIds?.length) {
  formData.append("amenityIds", payload.amenityIds.join(","));
}

  payload.images.forEach((file) => formData.append("images", file));

    const response = await api.post<ApiResponse<RoomResponse>>(`/rooms/${rentalAreaId}`, formData);
  return response.data;
},


    
  getRoomsByRentalArea: async (rentalAreaId: string): Promise<ApiResponse<RoomCardResponse[]>> => {
    const response = await api.get<ApiResponse<RoomCardResponse[]>>(
      `/rooms/rental-areas/${rentalAreaId}`
    );
    return response.data;
  },

  getRoomDetail: async (roomId: string): Promise<ApiResponse<RoomResponse>> => {
    const response = await api.get<ApiResponse<RoomResponse>>(`/rooms/${roomId}`);
    return response.data;
  },

  updateRoom: async (
    roomId: string,
    payload: UpdateRoomRequest,
    images?: File[]
  ): Promise<ApiResponse<RoomResponse>> => {
    const formData = new FormData();

    Object.entries(payload).forEach(([key, value]) => {
      if (value === undefined || value === null) return;

       if (Array.isArray(value)) {
    
    formData.append(key, value.join(","));
  } else {
    formData.append(key, String(value));
  }
    });

    if (images && images.length) {
      images.forEach((file) => formData.append("images", file));
    }

    const response = await api.put<ApiResponse<RoomResponse>>(`/rooms/${roomId}`, formData);
return response.data;
  },

  updateRoomStatus: async (roomId: string, status: RoomStatus): Promise<ApiResponse<RoomResponse>> => {
    const response = await api.patch<ApiResponse<RoomResponse>>(
      `/rooms/${roomId}/status`,
      null,
      { params: { status } }
    );
    return response.data;
  },

  deleteRoom: async (roomId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/rooms/${roomId}`);
    return response.data;
  },
};

export default roomsService;
