import { useEffect, useState } from "react";
import {
  walletService,
  type AdminEscrowItemResponse,
  type AdminWalletItemResponse,
  type AdminWalletTransactionItemResponse,
  type WalletTxStatus,
  type WalletTxType,
} from "../../../services/wallet/walletService";

type ErrorWithResponse = { response?: { data?: { message?: string } } };

const AdminWalletOverviewPage = () => {
  const [wallets, setWallets] = useState<AdminWalletItemResponse[]>([]);
  const [transactions, setTransactions] = useState<
    AdminWalletTransactionItemResponse[]
  >([]);
  const [escrows, setEscrows] = useState<AdminEscrowItemResponse[]>([]);

  const [walletLoading, setWalletLoading] = useState(false);
  const [txLoading, setTxLoading] = useState(false);
  const [escrowLoading, setEscrowLoading] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const [escrowError, setEscrowError] = useState<string | null>(null);

  const [walletKeyword, setWalletKeyword] = useState("");
  const [walletStatusFilter, setWalletStatusFilter] = useState<"" | "ACTIVE" | "LOCKED">("");
  const [walletUserIdFilter, setWalletUserIdFilter] = useState("");
  const [txKeyword, setTxKeyword] = useState("");
  const [txTypeFilter, setTxTypeFilter] = useState<"" | WalletTxType>("");
  const [txStatusFilter, setTxStatusFilter] = useState<"" | WalletTxStatus>("");
  const [txUserIdFilter, setTxUserIdFilter] = useState("");
  const [txWalletIdFilter, setTxWalletIdFilter] = useState("");
  const [txFromDateFilter, setTxFromDateFilter] = useState("");
  const [txToDateFilter, setTxToDateFilter] = useState("");
  const [escrowDisputedOnly, setEscrowDisputedOnly] = useState(false);
  const [escrowNoteByBooking, setEscrowNoteByBooking] = useState<Record<string, string>>({});

  const [walletPage, setWalletPage] = useState(1);
  const [txPage, setTxPage] = useState(1);
  const [escrowPage, setEscrowPage] = useState(1);
  const [walletTotalPages, setWalletTotalPages] = useState(1);
  const [txTotalPages, setTxTotalPages] = useState(1);
  const [escrowTotalPages, setEscrowTotalPages] = useState(1);

  const fetchWallets = async (targetPage = 1) => {
    setWalletLoading(true);
    setWalletError(null);
    try {
      const response = await walletService.getAdminWallets(
        targetPage,
        10,
        walletKeyword.trim() || undefined,
        walletStatusFilter || undefined,
        walletUserIdFilter.trim() || undefined,
      );
      const result = response.data.result;
      setWallets(result.data ?? []);
      setWalletPage(result.currentPage || targetPage);
      setWalletTotalPages(Math.max(result.totalPages || 1, 1));
    } catch (e: unknown) {
      const err = e as ErrorWithResponse;
      setWalletError(
        err?.response?.data?.message ?? "Không thể tải danh sách ví.",
      );
    } finally {
      setWalletLoading(false);
    }
  };

  const fetchEscrows = async (targetPage = 1) => {
    setEscrowLoading(true);
    setEscrowError(null);
    try {
      const response = await walletService.getAdminPendingEscrow(
        targetPage,
        10,
        escrowDisputedOnly || undefined,
      );
      const result = response.data.result;
      setEscrows(result.data ?? []);
      setEscrowPage(result.currentPage || targetPage);
      setEscrowTotalPages(Math.max(result.totalPages || 1, 1));
    } catch (e: unknown) {
      const err = e as ErrorWithResponse;
      setEscrowError(
        err?.response?.data?.message ?? "Không thể tải danh sách escrow.",
      );
    } finally {
      setEscrowLoading(false);
    }
  };

  const fetchTransactions = async (targetPage = 1) => {
    setTxLoading(true);
    setTxError(null);
    try {
      const response = await walletService.getAdminWalletTransactions(targetPage, 10, {
        keyword: txKeyword.trim() || undefined,
        type: txTypeFilter || undefined,
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
    } catch (e: unknown) {
      const err = e as ErrorWithResponse;
      setTxError(
        err?.response?.data?.message ?? "Không thể tải lịch sử giao dịch.",
      );
    } finally {
      setTxLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets(1);
    fetchTransactions(1);
    fetchEscrows(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpdateDispute = async (bookingId: string, disputed: boolean) => {
    await walletService.updateEscrowDispute(bookingId, disputed, escrowNoteByBooking[bookingId] || undefined);
    await fetchEscrows(escrowPage);
  };

  const handleTriggerRelease = async () => {
    await walletService.triggerEscrowReleaseNow();
    await fetchEscrows(1);
  };

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Tổng quan ví hệ thống</h1>
        <p className="text-sm text-gray-600">
          Xem toàn bộ ví người dùng và lịch sử giao dịch ví theo bộ lọc.
        </p>
      </div>

      <section className="bg-white border rounded-lg p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <input
            value={walletKeyword}
            onChange={(e) => setWalletKeyword(e.target.value)}
            placeholder="Tìm theo tên/email user"
            className="border rounded px-3 py-2 text-sm min-w-[250px]"
          />
          <select
            value={walletStatusFilter}
            onChange={(e) =>
              setWalletStatusFilter(e.target.value as "" | "ACTIVE" | "LOCKED")
            }
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="LOCKED">LOCKED</option>
          </select>
          <input
            value={walletUserIdFilter}
            onChange={(e) => setWalletUserIdFilter(e.target.value)}
            placeholder="User ID (UUID)"
            className="border rounded px-3 py-2 text-sm min-w-[250px]"
          />
          <button
            onClick={() => fetchWallets(1)}
            className="px-3 py-2 rounded bg-blue-600 text-white text-sm"
          >
            Lọc ví
          </button>
        </div>

        {walletLoading && <p className="text-sm text-gray-600">Đang tải ví...</p>}
        {walletError && <p className="text-sm text-red-600">{walletError}</p>}

        {!walletLoading && !walletError && (
          <>
            <div className="overflow-auto">
              <table className="min-w-full text-sm border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2 border text-left">User</th>
                    <th className="p-2 border text-left">Email</th>
                    <th className="p-2 border text-left">Balance</th>
                    <th className="p-2 border text-left">Frozen</th>
                    <th className="p-2 border text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {wallets.map((item) => (
                    <tr key={item.walletId}>
                      <td className="p-2 border">{item.userName}</td>
                      <td className="p-2 border">{item.userEmail}</td>
                      <td className="p-2 border">
                        {Number(item.balance).toLocaleString("vi-VN")} VNĐ
                      </td>
                      <td className="p-2 border">
                        {Number(item.frozenAmount).toLocaleString("vi-VN")} VNĐ
                      </td>
                      <td className="p-2 border">{item.walletStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <button
                disabled={walletPage <= 1}
                onClick={() => fetchWallets(walletPage - 1)}
                className="px-3 py-1.5 border rounded disabled:opacity-50"
              >
                Trước
              </button>
              <span className="text-sm">
                Trang {walletPage}/{walletTotalPages}
              </span>
              <button
                disabled={walletPage >= walletTotalPages}
                onClick={() => fetchWallets(walletPage + 1)}
                className="px-3 py-1.5 border rounded disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          </>
        )}
      </section>

      <section className="bg-white border rounded-lg p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <input
            value={txKeyword}
            onChange={(e) => setTxKeyword(e.target.value)}
            placeholder="Tìm theo mô tả/order code"
            className="border rounded px-3 py-2 text-sm min-w-[250px]"
          />
          <select
            value={txTypeFilter}
            onChange={(e) => setTxTypeFilter(e.target.value as "" | WalletTxType)}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="">Tất cả type</option>
            <option value="DEPOSIT">DEPOSIT</option>
            <option value="PAYMENT">PAYMENT</option>
            <option value="REFUND">REFUND</option>
            <option value="WITHDRAW">WITHDRAW</option>
          </select>
          <select
            value={txStatusFilter}
            onChange={(e) =>
              setTxStatusFilter(e.target.value as "" | WalletTxStatus)
            }
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="">Tất cả status</option>
            <option value="PENDING">PENDING</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="FAILED">FAILED</option>
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
            onClick={() => fetchTransactions(1)}
            className="px-3 py-2 rounded bg-blue-600 text-white text-sm"
          >
            Lọc giao dịch
          </button>
        </div>

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
                    <th className="p-2 border text-left">Type</th>
                    <th className="p-2 border text-left">Status</th>
                    <th className="p-2 border text-left">Amount</th>
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
                      <td className="p-2 border">{item.type}</td>
                      <td className="p-2 border">{item.status}</td>
                      <td className="p-2 border">
                        {Number(item.amount).toLocaleString("vi-VN")} VNĐ
                      </td>
                      <td className="p-2 border">{item.description || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <button
                disabled={txPage <= 1}
                onClick={() => fetchTransactions(txPage - 1)}
                className="px-3 py-1.5 border rounded disabled:opacity-50"
              >
                Trước
              </button>
              <span className="text-sm">
                Trang {txPage}/{txTotalPages}
              </span>
              <button
                disabled={txPage >= txTotalPages}
                onClick={() => fetchTransactions(txPage + 1)}
                className="px-3 py-1.5 border rounded disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          </>
        )}
      </section>

      <section className="bg-white border rounded-lg p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <label className="text-sm font-medium">Escrow đang giữ</label>
          <label className="text-sm flex items-center gap-1">
            <input
              type="checkbox"
              checked={escrowDisputedOnly}
              onChange={(e) => setEscrowDisputedOnly(e.target.checked)}
            />
            Chỉ hiển thị disputed
          </label>
          <button
            onClick={() => fetchEscrows(1)}
            className="px-3 py-2 rounded bg-blue-600 text-white text-sm"
          >
            Lọc escrow
          </button>
          <button
            onClick={handleTriggerRelease}
            className="px-3 py-2 rounded bg-green-600 text-white text-sm"
          >
            Chạy release ngay
          </button>
        </div>

        {escrowLoading && <p className="text-sm text-gray-600">Đang tải escrow...</p>}
        {escrowError && <p className="text-sm text-red-600">{escrowError}</p>}

        {!escrowLoading && !escrowError && (
          <>
            <div className="overflow-auto">
              <table className="min-w-full text-sm border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2 border text-left">Booking</th>
                    <th className="p-2 border text-left">Owner</th>
                    <th className="p-2 border text-left">Renter</th>
                    <th className="p-2 border text-left">Giữ</th>
                    <th className="p-2 border text-left">Commission</th>
                    <th className="p-2 border text-left">Net</th>
                    <th className="p-2 border text-left">Dự kiến cộng ví</th>
                    <th className="p-2 border text-left">Dispute</th>
                  </tr>
                </thead>
                <tbody>
                  {escrows.map((item) => (
                    <tr key={item.bookingId}>
                      <td className="p-2 border">{item.bookingId}</td>
                      <td className="p-2 border">{item.ownerName || "-"}</td>
                      <td className="p-2 border">{item.renterName || "-"}</td>
                      <td className="p-2 border">
                        {Number(item.grossAmount).toLocaleString("vi-VN")} VNĐ
                      </td>
                      <td className="p-2 border">
                        {(Number(item.commissionRate || 0) * 100).toFixed(2)}% (
                        {Number(item.commissionAmount).toLocaleString("vi-VN")} VNĐ)
                      </td>
                      <td className="p-2 border">
                        {Number(item.netAmount).toLocaleString("vi-VN")} VNĐ
                      </td>
                      <td className="p-2 border">
                        {item.expectedReleaseAt
                          ? new Date(item.expectedReleaseAt).toLocaleString("vi-VN")
                          : "-"}
                      </td>
                      <td className="p-2 border">
                        <div className="space-y-2">
                          <p>{item.disputeFlag ? "Đang disputed" : "Bình thường"}</p>
                          <input
                            value={escrowNoteByBooking[item.bookingId] ?? item.disputeNote ?? ""}
                            onChange={(e) =>
                              setEscrowNoteByBooking((prev) => ({
                                ...prev,
                                [item.bookingId]: e.target.value,
                              }))
                            }
                            className="border rounded px-2 py-1 text-xs w-full"
                            placeholder="Ghi chú dispute"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateDispute(item.bookingId, true)}
                              className="px-2 py-1 rounded bg-orange-600 text-white text-xs"
                            >
                              Gắn dispute
                            </button>
                            <button
                              onClick={() => handleUpdateDispute(item.bookingId, false)}
                              className="px-2 py-1 rounded bg-blue-600 text-white text-xs"
                            >
                              Gỡ dispute
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button
                disabled={escrowPage <= 1}
                onClick={() => fetchEscrows(escrowPage - 1)}
                className="px-3 py-1.5 border rounded disabled:opacity-50"
              >
                Trước
              </button>
              <span className="text-sm">
                Trang {escrowPage}/{escrowTotalPages}
              </span>
              <button
                disabled={escrowPage >= escrowTotalPages}
                onClick={() => fetchEscrows(escrowPage + 1)}
                className="px-3 py-1.5 border rounded disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default AdminWalletOverviewPage;

