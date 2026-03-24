import { useEffect, useState } from "react";
import { userService, type UserResponse } from "../../../services/usersService";
import {
  walletService,
  type AdminWalletStatusResponse,
} from "../../../services/wallet/walletService";

type ErrorWithResponse = { response?: { data?: { message?: string } } };

const WalletFreezeManagementPage = () => {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [freezeReasonByUser, setFreezeReasonByUser] = useState<
    Record<string, string>
  >({});
  const [walletStatusByUser, setWalletStatusByUser] = useState<
    Record<string, AdminWalletStatusResponse>
  >({});

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response: any = await userService.getAllUsers(1, 100);
      const actual = response.data ? response.data : response;
      if (actual?.code !== 200) {
        throw new Error(actual?.message || "Lấy danh sách user thất bại");
      }
      setUsers(actual.result?.data ?? []);
    } catch (e: unknown) {
      const err = e as ErrorWithResponse;
      setError(
        err?.response?.data?.message ??
          "Không thể tải danh sách user để quản lý ví.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleFreezeAction = async (userId: string, locked: boolean) => {
    const reason = (freezeReasonByUser[userId] || "").trim();
    if (locked && !reason) {
      alert("Vui lòng nhập lý do khóa ví.");
      return;
    }

    try {
      const response = await walletService.updateWalletFreezeStatus(userId, {
        locked,
        reason,
      });
      const status = response.data.result;
      setWalletStatusByUser((prev) => ({ ...prev, [userId]: status }));
      if (!locked) {
        setFreezeReasonByUser((prev) => ({ ...prev, [userId]: "" }));
      }
    } catch (e: unknown) {
      const err = e as ErrorWithResponse;
      alert(
        err?.response?.data?.message ??
          "Không thể cập nhật trạng thái ví của user.",
      );
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Quản lý khóa ví người dùng</h1>
      <p className="text-gray-600 mb-4">
        Thao tác freeze/unfreeze ví theo từng user.
      </p>

      {loading && <p className="text-sm text-gray-600">Đang tải dữ liệu...</p>}
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      {!loading && !error && (
        <div className="space-y-3">
          {users.map((user) => {
            const walletStatus = walletStatusByUser[user.userId];
            return (
              <div
                key={user.userId}
                className="border rounded-lg p-4 bg-white shadow-sm"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                  <p>
                    <b>User:</b> {user.userName}
                  </p>
                  <p>
                    <b>Email:</b> {user.email}
                  </p>
                  <p>
                    <b>Role:</b> {user.role}
                  </p>
                  <p>
                    <b>User ID:</b> {user.userId}
                  </p>
                  <p>
                    <b>Wallet status:</b>{" "}
                    {walletStatus ? walletStatus.walletStatus : "Chưa tải"}
                  </p>
                  <p>
                    <b>Lý do khóa:</b> {walletStatus?.frozenReason || "-"}
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <input
                    value={freezeReasonByUser[user.userId] ?? ""}
                    onChange={(e) =>
                      setFreezeReasonByUser((prev) => ({
                        ...prev,
                        [user.userId]: e.target.value,
                      }))
                    }
                    placeholder="Lý do khóa ví"
                    className="border rounded px-2 py-1.5 text-sm min-w-[220px]"
                  />
                  <button
                    onClick={() => handleFreezeAction(user.userId, true)}
                    className="px-3 py-1.5 rounded bg-orange-600 text-white"
                  >
                    Khóa ví
                  </button>
                  <button
                    onClick={() => handleFreezeAction(user.userId, false)}
                    className="px-3 py-1.5 rounded bg-blue-600 text-white"
                  >
                    Mở khóa ví
                  </button>
                </div>
              </div>
            );
          })}

          {users.length === 0 && (
            <p className="text-sm text-gray-600">Không có user nào.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default WalletFreezeManagementPage;

