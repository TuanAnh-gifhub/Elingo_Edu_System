import { useEffect, useMemo, useRef, useState } from "react";
import {
  walletService,
  type AdminWalletTransactionItemResponse,
  type WalletTxStatus,
} from "../../../services/wallet/walletService";

type ErrorWithResponse = { response?: { data?: { message?: string } } };

interface TransactionSummaryMetrics {
  totalDeposits: number;
  completedDeposits: number;
  failedDeposits: number;
  pendingDeposits: number;
  cancelledDeposits: number;
}

interface TransactionFilters {
  keyword: string;
  status: "" | WalletTxStatus;
  userId: string;
  walletId: string;
  fromDate: string;
  toDate: string;
}

const initialSummaryMetrics: TransactionSummaryMetrics = {
  totalDeposits: 0,
  completedDeposits: 0,
  failedDeposits: 0,
  pendingDeposits: 0,
  cancelledDeposits: 0,
};

const initialTransactionFilters: TransactionFilters = {
  keyword: "",
  status: "",
  userId: "",
  walletId: "",
  fromDate: "",
  toDate: "",
};

const normalizeFilters = (filters: TransactionFilters): TransactionFilters => ({
  keyword: filters.keyword.trim(),
  status: filters.status,
  userId: filters.userId.trim(),
  walletId: filters.walletId.trim(),
  fromDate: filters.fromDate,
  toDate: filters.toDate,
});

const statusLabelMap: Record<WalletTxStatus, string> = {
  PENDING: "Đang xử lý",
  COMPLETED: "Thành công",
  FAILED: "Thất bại",
  CANCELLED: "Đã hủy",
};

const statusClassMap: Record<WalletTxStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700 border-amber-200",
  COMPLETED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  FAILED: "bg-red-100 text-red-700 border-red-200",
  CANCELLED: "bg-slate-100 text-slate-700 border-slate-200",
};

const inputClassName =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const AdminWalletTransactionHistoryPage = () => {
  const [transactions, setTransactions] = useState<
    AdminWalletTransactionItemResponse[]
  >([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);

  const [draftFilters, setDraftFilters] = useState<TransactionFilters>(
    initialTransactionFilters,
  );
  const [appliedFilters, setAppliedFilters] = useState<TransactionFilters>(
    initialTransactionFilters,
  );

  const [txPage, setTxPage] = useState(1);
  const [txTotalPages, setTxTotalPages] = useState(1);
  const [txTotalElements, setTxTotalElements] = useState(0);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryMetrics, setSummaryMetrics] = useState<TransactionSummaryMetrics>(
    initialSummaryMetrics,
  );
  const latestTxRequestIdRef = useRef(0);

  const hasFilterChanges = useMemo(
    () => JSON.stringify(draftFilters) !== JSON.stringify(appliedFilters),
    [draftFilters, appliedFilters],
  );

  const appliedFilterTags = useMemo(() => {
    const tags: string[] = [];
    if (appliedFilters.keyword) tags.push(`Từ khóa: ${appliedFilters.keyword}`);
    if (appliedFilters.status) tags.push(`Trạng thái: ${statusLabelMap[appliedFilters.status]}`);
    if (appliedFilters.userId) tags.push(`User ID: ${appliedFilters.userId}`);
    if (appliedFilters.walletId) tags.push(`Wallet ID: ${appliedFilters.walletId}`);
    if (appliedFilters.fromDate) tags.push(`Từ ngày: ${appliedFilters.fromDate}`);
    if (appliedFilters.toDate) tags.push(`Đến ngày: ${appliedFilters.toDate}`);
    return tags;
  }, [appliedFilters]);

  const fetchSummaryMetrics = async () => {
    setSummaryLoading(true);
    setSummaryError(null);

    try {
      const summaryResult = await walletService.getAdminDepositTransactionSummary();
      const summary = summaryResult.data.result;

      setSummaryMetrics({
        totalDeposits: Number(summary.totalDeposits ?? 0),
        completedDeposits: Number(summary.completedDeposits ?? 0),
        failedDeposits: Number(summary.failedDeposits ?? 0),
        pendingDeposits: Number(summary.pendingDeposits ?? 0),
        cancelledDeposits: Number(summary.cancelledDeposits ?? 0),
      });
    } catch (e: unknown) {
      const err = e as ErrorWithResponse;
      setSummaryError(
        err?.response?.data?.message ?? "Không thể tải số liệu tổng quan giao dịch.",
      );
    } finally {
      setSummaryLoading(false);
    }
  };

  const fetchTransactions = async (
    targetPage = 1,
    filters: TransactionFilters = appliedFilters,
  ) => {
    const requestId = ++latestTxRequestIdRef.current;
    setTxLoading(true);
    setTxError(null);

    try {
      const response = await walletService.getAdminWalletTransactions(targetPage, 20, {
        keyword: filters.keyword || undefined,
        type: "DEPOSIT",
        status: filters.status || undefined,
        userId: filters.userId || undefined,
        walletId: filters.walletId || undefined,
        fromDate: filters.fromDate || undefined,
        toDate: filters.toDate || undefined,
      });

      if (requestId !== latestTxRequestIdRef.current) {
        return;
      }

      const result = response.data.result;
      setTransactions(result.data ?? []);
      setTxPage(result.currentPage || targetPage);
      setTxTotalPages(Math.max(result.totalPages || 1, 1));
      setTxTotalElements(Number(result.totalElements || 0));
    } catch (e: unknown) {
      if (requestId !== latestTxRequestIdRef.current) {
        return;
      }
      const err = e as ErrorWithResponse;
      setTxError(err?.response?.data?.message ?? "Không thể tải lịch sử giao dịch.");
    } finally {
      if (requestId === latestTxRequestIdRef.current) {
        setTxLoading(false);
      }
    }
  };

  const displayedTransactions = useMemo(() => {
    if (!appliedFilters.status) {
      return transactions;
    }
    return transactions.filter((item) => item.status === appliedFilters.status);
  }, [transactions, appliedFilters.status]);

  const applyFilters = async () => {
    const normalized = normalizeFilters(draftFilters);
    setAppliedFilters(normalized);
    await fetchTransactions(1, normalized);
  };

  const resetFilters = async () => {
    setDraftFilters(initialTransactionFilters);
    setAppliedFilters(initialTransactionFilters);
    await fetchTransactions(1, initialTransactionFilters);
  };

  useEffect(() => {
    void fetchSummaryMetrics();
    void fetchTransactions(1, initialTransactionFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-5 bg-gray-50 p-6">
      <div>
        <h1 className="mb-1 text-2xl font-bold text-gray-900">Lịch sử yêu cầu nạp tiền</h1>
        <p className="text-sm text-gray-600">
          Hiển thị toàn bộ yêu cầu nạp tiền của khách hàng: thành công, thất bại, đang xử lý.
        </p>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-gray-900">Tổng quan yêu cầu nạp tiền</h2>
            <button
              onClick={() => void fetchSummaryMetrics()}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Làm mới số liệu
            </button>
          </div>

          {summaryLoading && (
            <p className="text-sm text-gray-600">Đang tải số liệu tổng quan...</p>
          )}
          {summaryError && <p className="text-sm text-red-600">{summaryError}</p>}

          {!summaryLoading && !summaryError && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs text-gray-600">Tổng yêu cầu nạp tiền</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">{summaryMetrics.totalDeposits}</p>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-xs text-emerald-700">Nạp thành công</p>
                <p className="mt-1 text-xl font-semibold text-emerald-700">
                  {summaryMetrics.completedDeposits}
                </p>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-xs text-red-700">Nạp thất bại</p>
                <p className="mt-1 text-xl font-semibold text-red-700">
                  {summaryMetrics.failedDeposits}
                </p>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs text-amber-700">Đang xử lý</p>
                <p className="mt-1 text-xl font-semibold text-amber-700">
                  {summaryMetrics.pendingDeposits}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-700">Đã hủy</p>
                <p className="mt-1 text-xl font-semibold text-slate-700">
                  {summaryMetrics.cancelledDeposits}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <button
              onClick={() =>
                setDraftFilters((prev) => ({
                  ...prev,
                  status: "",
                }))
              }
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                draftFilters.status === ""
                  ? "border-blue-200 bg-blue-100 text-blue-700"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              Tất cả
            </button>
            {(Object.keys(statusLabelMap) as WalletTxStatus[]).map((status) => (
              <button
                key={status}
                onClick={() =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    status,
                  }))
                }
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  draftFilters.status === status
                    ? "border-blue-200 bg-blue-100 text-blue-700"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                {statusLabelMap[status]}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Từ khóa</label>
              <input
                value={draftFilters.keyword}
                onChange={(e) =>
                  setDraftFilters((prev) => ({ ...prev, keyword: e.target.value }))
                }
                placeholder="Tìm theo mô tả hoặc mã đơn"
                className={inputClassName}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Trạng thái</label>
              <select
                value={draftFilters.status}
                onChange={(e) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    status: e.target.value as "" | WalletTxStatus,
                  }))
                }
                className={inputClassName}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="PENDING">Đang xử lý</option>
                <option value="COMPLETED">Thành công</option>
                <option value="FAILED">Thất bại</option>
                <option value="CANCELLED">Đã hủy</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">User ID</label>
              <input
                value={draftFilters.userId}
                onChange={(e) =>
                  setDraftFilters((prev) => ({ ...prev, userId: e.target.value }))
                }
                placeholder="Nhập UUID người dùng"
                className={inputClassName}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Wallet ID</label>
              <input
                value={draftFilters.walletId}
                onChange={(e) =>
                  setDraftFilters((prev) => ({ ...prev, walletId: e.target.value }))
                }
                placeholder="Nhập UUID ví"
                className={inputClassName}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Từ ngày</label>
              <input
                type="date"
                value={draftFilters.fromDate}
                onChange={(e) =>
                  setDraftFilters((prev) => ({ ...prev, fromDate: e.target.value }))
                }
                className={inputClassName}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Đến ngày</label>
              <input
                type="date"
                value={draftFilters.toDate}
                onChange={(e) =>
                  setDraftFilters((prev) => ({ ...prev, toDate: e.target.value }))
                }
                className={inputClassName}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              onClick={() => void applyFilters()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Áp dụng bộ lọc
            </button>
            <button
              onClick={() => void resetFilters()}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Đặt lại
            </button>
            <span className="text-xs text-gray-500">
              {hasFilterChanges
                ? "Bạn có thay đổi chưa áp dụng"
                : "Bộ lọc đang đồng bộ"}
            </span>
          </div>
        </div>

        {appliedFilterTags.length > 0 && (
          <div className="mb-3 mt-3 flex flex-wrap items-center gap-2">
            {appliedFilterTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <p className="mb-3 text-sm text-gray-600">
          Tổng yêu cầu nạp tiền theo bộ lọc đang áp dụng: {txTotalElements}
        </p>

        {txLoading && <p className="text-sm text-gray-600">Đang tải giao dịch...</p>}
        {txError && <p className="text-sm text-red-600">{txError}</p>}

        {!txLoading && !txError && (
          <>
            <div className="overflow-auto rounded-xl border border-gray-200">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-gray-100">
                  <tr>
                    <th className="border-b border-gray-200 p-3 text-left font-semibold text-gray-700">
                      Thời gian
                    </th>
                    <th className="border-b border-gray-200 p-3 text-left font-semibold text-gray-700">
                      User
                    </th>
                    <th className="border-b border-gray-200 p-3 text-left font-semibold text-gray-700">
                      Email
                    </th>
                    <th className="border-b border-gray-200 p-3 text-left font-semibold text-gray-700">
                      Trạng thái
                    </th>
                    <th className="border-b border-gray-200 p-3 text-right font-semibold text-gray-700">
                      Số tiền
                    </th>
                    <th className="border-b border-gray-200 p-3 text-left font-semibold text-gray-700">
                      Mã đơn
                    </th>
                    <th className="border-b border-gray-200 p-3 text-left font-semibold text-gray-700">
                      Mô tả
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayedTransactions.map((item) => (
                    <tr key={item.transactionId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3 text-gray-700">
                        {new Date(item.createdAt).toLocaleString("vi-VN")}
                      </td>
                      <td className="p-3 text-gray-900">{item.userName}</td>
                      <td className="p-3 text-gray-700">{item.userEmail}</td>
                      <td className="p-3">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClassMap[item.status]}`}
                        >
                          {statusLabelMap[item.status]}
                        </span>
                      </td>
                      <td className="p-3 text-right font-semibold text-gray-900">
                        {Number(item.amount).toLocaleString("vi-VN")} VND
                      </td>
                      <td className="p-3 text-gray-700">{item.payosOrderCode || "-"}</td>
                      <td className="p-3 text-gray-700">{item.description || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-sm text-gray-600">
                Trang hiện tại: {txPage}/{txTotalPages}
              </p>
              <div className="flex items-center gap-2">
              <button
                disabled={txPage <= 1}
                onClick={() => void fetchTransactions(txPage - 1, appliedFilters)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 disabled:opacity-50"
              >
                Trước
              </button>
              <button
                disabled={txPage >= txTotalPages}
                onClick={() => void fetchTransactions(txPage + 1, appliedFilters)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 disabled:opacity-50"
              >
                Sau
              </button>
              </div>
            </div>

            {displayedTransactions.length === 0 && (
              <p className="text-sm text-gray-600 mt-3">Không có giao dịch phù hợp.</p>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default AdminWalletTransactionHistoryPage;




