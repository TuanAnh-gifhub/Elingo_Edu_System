import api from "../../config/axios";

export interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

export interface PageResponse<T> {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalElements: number;
  data: T[];
}

export type SubscriptionStatus = "ACTIVE" | "EXPIRED" | "CANCELLED";

export interface PackageResponse {
  packageId: string;
  name: string;
  description?: string;
  price: number;
  durationDays: number;
  maxClassesPerMonth?: number;
  maxCourses?: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserSubscriptionResponse {
  subscriptionId: string;
  userId: string;
  userName: string;
  userEmail: string;
  packageId: string;
  packageName: string;
  amountPaid: number;
  startDate: string;
  endDate: string;
  status: SubscriptionStatus;
  createdAt: string;
}

export interface CreatePackageRequest {
  name: string;
  description?: string;
  price: number;
  durationDays: number;
  maxClassesPerMonth?: number;
  maxCourses?: number;
}

export interface UpdatePackageRequest {
  name?: string;
  description?: string;
  price?: number;
  durationDays?: number;
  maxClassesPerMonth?: number;
  maxCourses?: number;
  active?: boolean;
}

export const subscriptionService = {
  // ---- Public ----
  getActivePackages: () =>
    api.get<ApiResponse<PackageResponse[]>>("/packages/active"),

  getPackageById: (packageId: string) =>
    api.get<ApiResponse<PackageResponse>>(`/packages/${packageId}`),

  // ---- Admin ----
  getAllPackages: (page = 1, limit = 20) =>
    api.get<ApiResponse<PageResponse<PackageResponse>>>("/packages/admin/all", {
      params: { page, limit },
    }),

  createPackage: (body: CreatePackageRequest) =>
    api.post<ApiResponse<PackageResponse>>("/packages/admin", body),

  updatePackage: (packageId: string, body: UpdatePackageRequest) =>
    api.patch<ApiResponse<PackageResponse>>(`/packages/admin/${packageId}`, body),

  deletePackage: (packageId: string) =>
    api.delete<ApiResponse<void>>(`/packages/admin/${packageId}`),

  getAllSubscriptions: (page = 1, limit = 20, userId?: string) =>
    api.get<ApiResponse<PageResponse<UserSubscriptionResponse>>>(
      "/packages/admin/subscriptions",
      { params: { page, limit, userId } }
    ),

  // ---- User ----
  purchasePackage: (packageId: string) =>
    api.post<ApiResponse<UserSubscriptionResponse>>(
      `/packages/${packageId}/purchase`
    ),

  getMySubscriptions: (page = 1, limit = 20) =>
    api.get<ApiResponse<PageResponse<UserSubscriptionResponse>>>(
      "/packages/me/subscriptions",
      { params: { page, limit } }
    ),

  getMyActiveSubscription: () =>
    api.get<ApiResponse<UserSubscriptionResponse | null>>(
      "/packages/me/active"
    ),
};
