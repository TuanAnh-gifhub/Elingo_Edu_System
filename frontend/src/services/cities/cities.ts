import api from "../../config/axios";

export interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

export interface CityResponse {
  cityId: number; 
  cityName: string;
}

const citiesService = {
  getAllCities: async (): Promise<ApiResponse<CityResponse[]>> => {
    const response = await api.get<ApiResponse<CityResponse[]>>("/cities");
    return response.data;
  },
};

export default citiesService;
