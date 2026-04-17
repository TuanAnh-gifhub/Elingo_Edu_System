import api from "../../config/axios";

export interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

export interface CheckoutResponse {
  mode: "BOOKED" | "REDIRECT" | "PENDING" | "FAILED";
  paymentStatus: string;
  bookingId?: string | null;
  paymentUrl?: string | null;
  orderCode?: string | null;
  message?: string | null;
}

export const paymentService = {
  getBookingPaymentResult: (params: { orderCode: string; status: string }) =>
    api.get<any, ApiResponse<CheckoutResponse>>("/payments/result", { params }),
};

