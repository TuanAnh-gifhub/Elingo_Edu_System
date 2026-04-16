import { useEffect, useState } from "react";
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

const initialSummaryMetrics: TransactionSummaryMetrics = {
  totalDeposits: 0,
  completedDeposits: 0,
  failedDeposits: 0,
  pendingDeposits: 0,
  cancelledDeposits: 0,
};

const AdminWalletTransactionHistoryPage = () => {
  const [transactions, setTransactions] = useState<
    AdminWalletTransactionItemResponse[]
  >([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);

  const [txKeyword, setTxKeyword] = useState("");
  const [txStatusFilter, setTxStatusFilter] = useState<"" | WalletTxStatus>("");
  const [txUserIdFilter, setTxUserIdFilter] = useState("");
  const [txWalletIdFilter, setTxWalletIdFilter] = useState("");
  const [txFromDateFilter, setTxFromDateFilter] = useState("");
  const [txToDateFilter, setTxToDateFilter] = useState("");

  const [txPage, setTxPage] = useState(1);
  const [txTotalPages, setTxTotalPages] = useState(1);
  const [txTotalElements, setTxTotalElements] = useState(0);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryMetrics, setSummaryMetrics] = useState<TransactionSummaryMetrics>(
    initialSummaryMetrics,
  );

  const fetchSummaryMetrics = async () => {
    setSummaryLoading(true);
    setSummaryError(null);

    try {
      const [
        totalDepositResult,
        completedDepositResult,
        failedDepositResult,
        pendingDepositResult,
        cancelledDepositResult,
      ] = await Promise.all([
        walletService.getAdminWalletTransactions(1, 1, { type: "DEPOSIT" }),
        walletService.getAdminWalletTransactions(1, 1, {
          type: "DEPOSIT",
          status: "COMPLETED",
        }),
        walletService.getAdminWalletTransactions(1, 1, {
          type: "DEPOSIT",
          status: "FAILED",
        }),
        walletService.getAdminWalletTransactions(1, 1, {
          type: "DEPOSIT",
          status: "PENDING",
        }),
        walletService.getAdminWalletTransactions(1, 1, {
          type: "DEPOSIT",
          status: "CANCELLED",
        }),
      ]);

      setSummaryMetrics({
        totalDeposits: Number(totalDepositResult.data.result.totalElements ?? 0),
        completedDeposits: Number(completedDepositResult.data.result.totalElements ?? 0),
        failedDeposits: Number(failedDepositResult.data.result.totalElements ?? 0),
        pendingDeposits: Number(pendingDepositResult.data.result.totalElements ?? 0),
        cancelledDeposits: Number(cancelledDepositResult.data.result.totalElements ?? 0),
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

  const fetchTransactions = async (targetPage = 1) => {
    setTxLoading(true);
    setTxError(null);

    try {
      const response = await walletService.getAdminWalletTransactions(targetPage, 20, {
        keyword: txKeyword.trim() || undefined,
        type: "DEPOSIT",
        status: txStatusFilter || undefined,
        userId: txUserIdFilter.trim() || undefined,
        walletId: txWalletIdFilter.trim() || undefined,
        fromDate: txFromDateFilter || undefined,
        toDate: txToDateFilter || undefined,
      });
      const result = response.data.result;
      setTransactions(result.data ?? []);
      setTxPage(result.currentPage || targetPage);
      setTxTotalPages(Math.max(result.totalPages || 1, 1));
      setTxTotalElements(Number(result.totalElements || 0));
    } catch (e: unknown) {
      const err = e as ErrorWithResponse;
      setTxError(err?.response?.data?.message ?? "Không thể tải lịch sử giao dịch.");
    } finally {
      setTxLoading(false);
    }
  };

  useEffect(() => {
    void fetchSummaryMetrics();
    void fetchTransactions(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold mb-1">Lịch sử yêu cầu nạp tiền</h1>
        <p className="text-sm text-gray-600">
          Hiển thị toàn bộ yêu cầu nạp tiền của khách hàng: thành công, thất bại, đang xử lý.
        </p>
      </div>

      <section className="bg-white border rounded-lg p-4 shadow-sm">
        <div className="mb-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h2 className="text-base font-semibold">Tổng quan yêu cầu nạp tiền</h2>
            <button
              onClick={() => void fetchSummaryMetrics()}
              className="px-3 py-1.5 rounded border text-sm"
            >
              Làm mới số liệu
            </button>
          </div>

          {summaryLoading && (
            <p className="text-sm text-gray-600">Đang tải số liệu tổng quan...</p>
          )}
          {summaryError && <p className="text-sm text-red-600">{summaryError}</p>}

          {!summaryLoading && !summaryError && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
              <div className="border rounded p-3 bg-gray-50">
                <p className="text-xs text-gray-600">Tổng yêu cầu nạp tiền</p>
                <p className="text-lg font-semibold">{summaryMetrics.totalDeposits}</p>
              </div>
              <div className="border rounded p-3 bg-green-50">
                <p className="text-xs text-gray-600">Nạp thành công</p>
                <p className="text-lg font-semibold text-green-700">
                  {summaryMetrics.completedDeposits}
                </p>
              </div>
              <div className="border rounded p-3 bg-red-50">
                <p className="text-xs text-gray-600">Nạp thất bại</p>
                <p className="text-lg font-semibold text-red-700">
                  {summaryMetrics.failedDeposits}
                </p>
              </div>
              <div className="border rounded p-3 bg-orange-50">
                <p className="text-xs text-gray-600">Đang xử lý</p>
                <p className="text-lg font-semibold text-orange-700">
                  {summaryMetrics.pendingDeposits}
                </p>
              </div>
              <div className="border rounded p-3 bg-gray-100">
                <p className="text-xs text-gray-600">Đã hủy</p>
                <p className="text-lg font-semibold text-gray-700">
                  {summaryMetrics.cancelledDeposits}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <input
            value={txKeyword}
            onChange={(e) => setTxKeyword(e.target.value)}
            placeholder="Tìm theo mô tả/order code"
            className="border rounded px-3 py-2 text-sm min-w-[250px]"
          />
          <select
            value={txStatusFilter}
            onChange={(e) => setTxStatusFilter(e.target.value as "" | WalletTxStatus)}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="">Tất cả status</option>
            <option value="PENDING">PENDING</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="FAILED">FAILED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
          <input
            value={txUserIdFilter}
            onChange={(e) => setTxUserIdFilter(e.target.value)}
            placeholder="User ID (UUID)"
            className="border rounded px-3 py-2 text-sm min-w-[250px]"
          />
          <input
            value={txWalletIdFilter}
            onChange={(e) => setTxWalletIdFilter(e.target.value)}
            placeholder="Wallet ID (UUID)"
            className="border rounded px-3 py-2 text-sm min-w-[250px]"
          />
          <input
            type="date"
            value={txFromDateFilter}
            onChange={(e) => setTxFromDateFilter(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={txToDateFilter}
            onChange={(e) => setTxToDateFilter(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          />
          <button
            onClick={() => void fetchTransactions(1)}
            className="px-3 py-2 rounded bg-blue-600 text-white text-sm"
          >
            Lọc giao dịch
          </button>
        </div>

        <p className="text-xs text-gray-500 mb-3">
          Tổng yêu cầu nạp tiền theo bộ lọc hiện tại: {txTotalElements}
        </p>

        {txLoading && <p className="text-sm text-gray-600">Đang tải giao dịch...</p>}
        {txError && <p className="text-sm text-red-600">{txError}</p>}

        {!txLoading && !txError && (
          <>
            <div className="overflow-auto">
              <table className="min-w-full text-sm border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2 border text-left">Thời gian</th>
                    <th className="p-2 border text-left">User</th>
                    <th className="p-2 border text-left">Email</th>
                    <th className="p-2 border text-left">Status</th>
                    <th className="p-2 border text-left">Amount</th>
                    <th className="p-2 border text-left">Order code</th>
                    <th className="p-2 border text-left">Mô tả</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((item) => (
                    <tr key={item.transactionId}>
                      <td className="p-2 border">
                        {new Date(item.createdAt).toLocaleString("vi-VN")}
                      </td>
                      <td className="p-2 border">{item.userName}</td>
                      <td className="p-2 border">{item.userEmail}</td>
                      <td className="p-2 border">{item.status}</td>
                      <td className="p-2 border">
                        {Number(item.amount).toLocaleString("vi-VN")} VNĐ
                      </td>
                      <td className="p-2 border">{item.payosOrderCode || "-"}</td>
                      <td className="p-2 border">{item.description || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <button
                disabled={txPage <= 1}
                onClick={() => void fetchTransactions(txPage - 1)}
                className="px-3 py-1.5 border rounded disabled:opacity-50"
              >
                Trước
              </button>
              <span className="text-sm">
                Trang {txPage}/{txTotalPages}
              </span>
              <button
                disabled={txPage >= txTotalPages}
                onClick={() => void fetchTransactions(txPage + 1)}
                className="px-3 py-1.5 border rounded disabled:opacity-50"
              >
                Sau
              </button>
            </div>

            {transactions.length === 0 && (
              <p className="text-sm text-gray-600 mt-3">Không có giao dịch phù hợp.</p>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default AdminWalletTransactionHistoryPage;




