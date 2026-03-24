import { useEffect, useMemo, useState } from "react";
import { walletService, type AdminWithdrawRequestItemResponse, type WithdrawStatus } from "../../../services/wallet/walletService";

type ErrorWithResponse = { response?: { data?: { message?: string } } };

const WalletWithdrawManagementPage = () => {
  const [items, setItems] = useState<AdminWithdrawRequestItemResponse[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});
  const [freezeReasons, setFreezeReasons] = useState<Record<string, string>>({});

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const status = statusFilter
        ? (statusFilter as WithdrawStatus)
        : undefined;
      const response = await walletService.getAdminWithdrawRequests(1, 50, status);
      const result = response.data.result;
      setItems(result.data ?? []);
    } catch (e: unknown) {
      const err = e as ErrorWithResponse;
      setError(
        err?.response?.data?.message ??
          "Không thể tải danh sách yêu cầu rút tiền.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const pendingCount = useMemo(
    () => items.filter((x) => x.status === "PENDING").length,
    [items],
  );

  const handleApprove = async (withdrawRequestId: string) => {
    await walletService.approveWithdrawRequest(withdrawRequestId);
    await fetchData();
  };

  const handleReject = async (withdrawRequestId: string) => {
    const note = rejectNotes[withdrawRequestId]?.trim();
    if (!note) {
      alert("Vui lòng nhập lý do từ chối.");
      return;
    }
    await walletService.rejectWithdrawRequest(withdrawRequestId, note);
    setRejectNotes((prev) => ({ ...prev, [withdrawRequestId]: "" }));
    await fetchData();
  };

  const handleFreeze = async (userId: string, locked: boolean) => {
    const reason = (freezeReasons[userId] || "").trim();
    if (locked && !reason) {
      alert("Vui lòng nhập lý do khóa ví.");
      return;
    }
    await walletService.updateWalletFreezeStatus(userId, { locked, reason });
    await fetchData();
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Quản lý rút tiền ví</h1>
      <p className="text-gray-600 mb-4">
        Yêu cầu chờ duyệt: <span className="font-semibold">{pendingCount}</span>
      </p>

      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm font-medium">Lọc trạng thái</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="">Tất cả</option>
          <option value="PENDING">PENDING</option>
          <option value="APPROVED">APPROVED</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="REJECTED">REJECTED</option>
        </select>
      </div>

      {loading && <p className="text-sm text-gray-600">Đang tải dữ liệu...</p>}
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      {!loading && !error && (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.withdrawRequestId}
              className="border rounded-lg p-4 bg-white shadow-sm"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                <p>
                  <b>User:</b> {item.userName} ({item.userId})
                </p>
                <p>
                  <b>Số tiền:</b> {Number(item.amount).toLocaleString("vi-VN")} đ
                </p>
                <p>
                  <b>Trạng thái:</b> {item.status}
                </p>
                <p>
                  <b>Ngân hàng:</b> {item.bankCode}
                </p>
                <p>
                  <b>Tài khoản:</b> {item.bankAccountNumber}
                </p>
                <p>
                  <b>Chủ TK:</b> {item.bankAccountName}
                </p>
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">Duyệt/Từ chối rút tiền</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      disabled={item.status !== "PENDING"}
                      onClick={() => handleApprove(item.withdrawRequestId)}
                      className="px-3 py-1.5 rounded bg-green-600 text-white disabled:opacity-50"
                    >
                      Duyệt
                    </button>
                    <input
                      value={rejectNotes[item.withdrawRequestId] ?? ""}
                      onChange={(e) =>
                        setRejectNotes((prev) => ({
                          ...prev,
                          [item.withdrawRequestId]: e.target.value,
                        }))
                      }
                      placeholder="Lý do từ chối"
                      className="border rounded px-2 py-1.5 text-sm min-w-[220px]"
                    />
                    <button
                      disabled={item.status !== "PENDING"}
                      onClick={() => handleReject(item.withdrawRequestId)}
                      className="px-3 py-1.5 rounded bg-red-600 text-white disabled:opacity-50"
                    >
                      Từ chối
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-gray-500">Khóa/Mở khóa ví user</p>
                  <div className="flex flex-wrap gap-2">
                    <input
                      value={freezeReasons[item.userId] ?? ""}
                      onChange={(e) =>
                        setFreezeReasons((prev) => ({
                          ...prev,
                          [item.userId]: e.target.value,
                        }))
                      }
                      placeholder="Lý do khóa ví"
                      className="border rounded px-2 py-1.5 text-sm min-w-[220px]"
                    />
                    <button
                      onClick={() => handleFreeze(item.userId, true)}
                      className="px-3 py-1.5 rounded bg-orange-600 text-white"
                    >
                      Khóa ví
                    </button>
                    <button
                      onClick={() => handleFreeze(item.userId, false)}
                      className="px-3 py-1.5 rounded bg-blue-600 text-white"
                    >
                      Mở khóa ví
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <p className="text-sm text-gray-600">Chưa có yêu cầu rút tiền nào.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default WalletWithdrawManagementPage;

