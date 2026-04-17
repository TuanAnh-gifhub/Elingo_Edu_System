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

export type WalletTxStatus = "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";
export type WalletTxType =
  | "DEPOSIT"
  | "WITHDRAW"
  | "WITHDRAW_REJECTED"
  | "BOOKING_INCOME"
  | "BOOKING_PAYMENT"
  | "PACKAGE_PURCHASE"
  | "COMMISSION"
  | "REFUND"
  | "FREEZE_HOLD"
  | "FREEZE_RELEASE";
export type WithdrawStatus = "PENDING" | "APPROVED" | "COMPLETED" | "REJECTED";

export interface WalletInfoResponse {
  walletId: string;
  balance: number;
  frozenAmount: number;
  isFrozen: boolean;
  frozenReason?: string | null;
  createdAt: string;
}

export interface WalletTransactionItemResponse {
  transactionId: string;
  type: WalletTxType;
  status: WalletTxStatus;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description?: string | null;
  payosOrderCode?: string | null;
  createdAt: string;
}

export interface DepositLinkResponse {
  paymentUrl: string;
  orderCode: string;
}

export interface CreateDepositLinkRequest {
  amount: number;
}

export interface CreateWithdrawRequest {
  amount: number;
  bankCode: string;
  bankAccountNumber: string;
  bankAccountName: string;
}

export interface WithdrawRequestItemResponse {
  withdrawRequestId: string;
  amount: number;
  bankCode: string;
  bankAccountNumber: string;
  bankAccountName: string;
  status: "PENDING" | "APPROVED" | "COMPLETED" | "REJECTED";
  adminNote?: string | null;
  processedBy?: string | null;
  processedAt?: string | null;
  createdAt: string;
}

export type CommissionInfoResponse = {
  rate: number;
  custom?: boolean;
  isCustom?: boolean;
  effectiveFrom?: string;
};

export type RevenueOverviewResponse = {
  totalIncome: number;
  totalCommission: number;
  netRevenue: number;
  transactions: WalletTransactionItemResponse[];
};

export type EscrowItemResponse = {
  bookingId: string;
  grossAmount: number;
  commissionRate: number;
  commissionAmount: number;
  netAmount: number;
  bookingEndedAt?: string;
  expectedReleaseAt?: string;
  disputeFlag?: boolean;
  disputeNote?: string;
};

export type EscrowSummaryResponse = {
  totalHoldingAmount: number;
  totalCommissionAmount: number;
  totalNetAmount: number;
  items: EscrowItemResponse[];
};

export type AdminWithdrawRequestItemResponse = {
  withdrawRequestId: string;
  walletId: string;
  userId: string;
  userName: string;
  amount: number;
  bankCode: string;
  bankAccountNumber: string;
  bankAccountName: string;
  status: WithdrawStatus;
  adminNote?: string;
  processedBy?: string;
  processedAt?: string;
  createdAt: string;
};

export type AdminWithdrawRequestPageResponse = PageResponse<AdminWithdrawRequestItemResponse>;

export type UpdateWalletFreezePayload = {
  locked: boolean;
  reason?: string;
};

export type AdminWalletStatusResponse = {
  walletId: string;
  userId: string;
  userName: string;
  balance: number;
  frozenAmount: number;
  walletStatus: "ACTIVE" | "LOCKED";
  frozenReason?: string;
};

export type AdminWalletItemResponse = {
  walletId: string;
  userId: string;
  userName: string;
  userEmail: string;
  balance: number;
  frozenAmount: number;
  walletStatus: "ACTIVE" | "LOCKED";
  frozenReason?: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminWalletPageResponse = PageResponse<AdminWalletItemResponse>;

export type AdminWalletTransactionItemResponse = {
  transactionId: string;
  walletId: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: WalletTxType;
  status: WalletTxStatus;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  payosOrderCode?: string;
  withdrawRequestId?: string;
  createdAt: string;
};

export type AdminWalletTransactionPageResponse =
  PageResponse<AdminWalletTransactionItemResponse>;

export type AdminDepositTransactionSummaryResponse = {
  totalDeposits: number;
  completedDeposits: number;
  failedDeposits: number;
  pendingDeposits: number;
  cancelledDeposits: number;
};

export type AdminPlatformIncomeBucketResponse = {
  period: string;
  subscriptionIncome: number;
  commissionIncome: number;
  totalIncome: number;
};

export type AdminPlatformIncomeTrendResponse = {
  fromDate: string;
  toDate: string;
  totalSubscriptionIncome: number;
  totalCommissionIncome: number;
  totalIncome: number;
  daily: AdminPlatformIncomeBucketResponse[];
  monthly: AdminPlatformIncomeBucketResponse[];
};

export type AdminDepositTrendBucketResponse = {
  period: string;
  totalAmount: number;
  depositingUsers: number;
};

export type AdminDepositTrendResultResponse = {
  fromDate: string;
  toDate: string;
  totalAmount: number;
  totalDepositingUsers: number;
  daily: AdminDepositTrendBucketResponse[];
  monthly: AdminDepositTrendBucketResponse[];
};

export type UpsertCommissionConfigPayload = {
  rate: number;
  note?: string;
};

export type ClassWalletFeeConfigResponse = {
  feePercent: number;
  note?: string;
  effectiveFrom?: string;
  updatedAt?: string;
};

export type UpdateClassWalletFeePayload = {
  feePercent: number;
  note?: string;
};

export type AdminCommissionConfigResponse = {
  commissionConfigId: string;
  default?: boolean;
  isDefault?: boolean;
  ownerId?: string;
  ownerName?: string;
  ownerEmail?: string;
  rate: number;
  note?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminCommissionConfigListResponse = {
  defaultConfig?: AdminCommissionConfigResponse;
  ownerConfigs: AdminCommissionConfigResponse[];
};

export type AdminEscrowItemResponse = {
  bookingId: string;
  ownerId?: string;
  ownerName?: string;
  renterId?: string;
  renterName?: string;
  grossAmount: number;
  commissionRate: number;
  commissionAmount: number;
  netAmount: number;
  bookingEndedAt?: string;
  expectedReleaseAt?: string;
  disputeFlag?: boolean;
  disputeNote?: string;
};

export type AdminEscrowPageResponse = PageResponse<AdminEscrowItemResponse>;

export const walletService = {
  getMyWallet: () => api.get<ApiResponse<WalletInfoResponse>>("/wallet/me"),

  getMyTransactions: (params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
  }) =>
    api.get<ApiResponse<PageResponse<WalletTransactionItemResponse>>>(
      "/wallet/transactions",
      { params },
    ),

  createDepositLink: (body: CreateDepositLinkRequest) =>
    api.post<ApiResponse<DepositLinkResponse>>(
      "/wallet/deposit/create-link",
      body,
    ),

  recordDepositResult: (params: { orderCode: string; status: string }) =>
    api.get<ApiResponse<{ orderCode: string; status: string }>>(
      "/wallet/deposit/result",
      { params },
    ),

  finalizeDepositResult: (orderCode: string, status: string) =>
    api.get<ApiResponse<{ orderCode: string; status: string }>>(
      "/wallet/deposit/result",
      {
        params: { orderCode, status },
      },
    ),

  createWithdrawRequest: (body: CreateWithdrawRequest) =>
    api.post<ApiResponse<WithdrawRequestItemResponse>>(
      "/wallet/withdraw-requests",
      body,
    ),

  getMyWithdrawRequests: (page: number, limit: number, status?: WithdrawStatus) =>
    api.get<ApiResponse<PageResponse<WithdrawRequestItemResponse>>>(
      "/wallet/withdraw-requests",
      {
        params: { page, limit, status },
      },
    ),

  getMyCommission: () =>
    api.get<ApiResponse<CommissionInfoResponse>>("/wallet/commission"),

  getMyRevenue: (fromDate?: string, toDate?: string) =>
    api.get<ApiResponse<RevenueOverviewResponse>>("/wallet/revenue", {
      params: { fromDate, toDate },
    }),

  getMyPendingEscrow: () =>
    api.get<ApiResponse<EscrowSummaryResponse>>("/wallet/escrow/pending"),

  // --- ADMIN ENDPOINTS ---
  getAdminWithdrawRequests: (
    page = 1,
    limit = 20,
    status?: WithdrawStatus,
    userId?: string,
  ) =>
    api.get<ApiResponse<AdminWithdrawRequestPageResponse>>(
      "/wallet/admin/withdraw-requests",
      {
        params: { page, limit, status, userId },
      },
    ),

  approveWithdrawRequest: (withdrawRequestId: string) =>
    api.patch<ApiResponse<unknown>>(
      `/wallet/admin/withdraw-requests/${withdrawRequestId}/approve`,
    ),

  rejectWithdrawRequest: (withdrawRequestId: string, adminNote: string) =>
    api.patch<ApiResponse<unknown>>(
      `/wallet/admin/withdraw-requests/${withdrawRequestId}/reject`,
      { adminNote },
    ),

  updateWalletFreezeStatus: (userId: string, payload: UpdateWalletFreezePayload) =>
    api.patch<ApiResponse<AdminWalletStatusResponse>>(
      `/wallet/admin/users/${userId}/freeze`,
      payload,
    ),

  getAdminWallets: (
    page = 1,
    limit = 20,
    keyword?: string,
    walletStatus?: "ACTIVE" | "LOCKED",
    userId?: string,
  ) =>
    api.get<ApiResponse<AdminWalletPageResponse>>("/wallet/admin/wallets", {
      params: { page, limit, keyword, walletStatus, userId },
    }),

  getAdminWalletTransactions: (
    page = 1,
    limit = 20,
    params?: {
      type?: WalletTxType;
      status?: WalletTxStatus;
      fromDate?: string;
      toDate?: string;
      keyword?: string;
      userId?: string;
      walletId?: string;
    },
  ) =>
    api.get<ApiResponse<AdminWalletTransactionPageResponse>>(
      "/wallet/admin/transactions",
      {
        params: { page, limit, ...params },
      },
    ),

  getAdminDepositTransactionSummary: (params?: { fromDate?: string; toDate?: string }) =>
    api.get<ApiResponse<AdminDepositTransactionSummaryResponse>>(
      "/wallet/admin/transactions/deposit-summary",
      { params },
    ),

  getAdminPlatformIncomeTrend: (params?: { fromDate?: string; toDate?: string }) =>
    api.get<ApiResponse<AdminPlatformIncomeTrendResponse>>(
      "/wallet/admin/income-trend",
      { params },
    ),

  getAdminDepositTrend: (params?: { fromDate?: string; toDate?: string }) =>
    api.get<ApiResponse<AdminDepositTrendResultResponse>>(
      "/wallet/admin/deposit-trend",
      { params },
    ),

  getAdminCommissionConfigs: () =>
    api.get<ApiResponse<AdminCommissionConfigListResponse>>(
      "/wallet/admin/commission-configs",
    ),

  upsertDefaultCommission: (payload: UpsertCommissionConfigPayload) =>
    api.put<ApiResponse<AdminCommissionConfigResponse>>(
      "/wallet/admin/commission/default",
      payload,
    ),

  upsertOwnerCommission: (ownerId: string, payload: UpsertCommissionConfigPayload) =>
    api.put<ApiResponse<AdminCommissionConfigResponse>>(
      `/wallet/admin/commission/owners/${ownerId}`,
      payload,
    ),

  getAdminPendingEscrow: (page = 1, limit = 20, disputedOnly?: boolean) =>
    api.get<ApiResponse<AdminEscrowPageResponse>>(
      "/wallet/admin/escrow/pending",
      {
        params: { page, limit, disputedOnly },
      },
    ),

  updateEscrowDispute: (bookingId: string, disputed: boolean, note?: string) =>
    api.patch<ApiResponse<unknown>>(
      `/wallet/admin/escrow/${bookingId}/dispute`,
      { disputed, note },
    ),

  triggerEscrowReleaseNow: () =>
    api.post<ApiResponse<{ releasedCount: number }>>(
      "/wallet/admin/escrow/release-now",
    ),

  getAdminClassWalletFee: () =>
    api.get<ApiResponse<ClassWalletFeeConfigResponse>>(
      "/wallet/admin/class-wallet-fee",
    ),

  updateAdminClassWalletFee: (payload: UpdateClassWalletFeePayload) =>
    api.put<ApiResponse<ClassWalletFeeConfigResponse>>(
      "/wallet/admin/class-wallet-fee",
      payload,
    ),
};

