import api from "../../config/axios";

export interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  durationInDays: number;
  features: string[];
  status: "ACTIVE" | "INACTIVE";
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePackageRequest {
  name: string;
  description: string;
  price: number;
  durationInDays: number;
  features: string[];
}

const packageService = {
  // Admin APIs
  admin: {
    createPackage: async (data: CreatePackageRequest) => {
      const response = await api.post("/admin/packages", data);
      return response.data;
    },
    getAllPackages: async () => {
      const response = await api.get("/admin/packages");
      return response.data;
    },
    getPackageById: async (id: string) => {
      const response = await api.get(`/admin/packages/${id}`);
      return response.data;
    },
    updatePackage: async (id: string, data: Partial<CreatePackageRequest>) => {
      const response = await api.put(`/admin/packages/${id}`, data);
      return response.data;
    },
    deletePackage: async (id: string) => {
      const response = await api.delete(`/admin/packages/${id}`);
      return response.data;
    },
  },

  // User APIs
  user: {
    getAllAvailablePackages: async () => {
      const response = await api.get("/packages");
      return response.data;
    },
    purchasePackage: async (id: string) => {
      const response = await api.post(`/packages/${id}/purchase`);
      return response.data;
    },
  },
};

export default packageService;
