import { useEffect, useState } from "react";
import { userService, type UserResponse } from "../../../services/usersService";
import {
  walletService,
  type AdminCommissionConfigListResponse,
} from "../../../services/wallet/walletService";

type ErrorWithResponse = { response?: { data?: { message?: string } } };

const CommissionConfigManagementPage = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [configs, setConfigs] = useState<AdminCommissionConfigListResponse>({
    ownerConfigs: [],
  });
  const [owners, setOwners] = useState<UserResponse[]>([]);

  const [defaultRate, setDefaultRate] = useState("0.1");
  const [defaultNote, setDefaultNote] = useState("");

  const [selectedOwnerId, setSelectedOwnerId] = useState("");
  const [ownerRate, setOwnerRate] = useState("0.1");
  const [ownerNote, setOwnerNote] = useState("");

  const fetchConfigs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await walletService.getAdminCommissionConfigs();
      const result = response.data.result;
      setConfigs(result);
      if (result.defaultConfig?.rate != null) {
        setDefaultRate(String(result.defaultConfig.rate));
      }
      if (result.defaultConfig?.note) {
        setDefaultNote(result.defaultConfig.note);
      }
    } catch (e: unknown) {
      const err = e as ErrorWithResponse;
      setError(
        err?.response?.data?.message ?? "Không thể tải cấu hình commission.",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchOwners = async () => {
    try {
      const response = await userService.getAllUsers(
        1,
        200,
        "OWNER",
        true,
      );
      const raw = response as {
        data?: { result?: { data?: UserResponse[] } };
        result?: { data?: UserResponse[] };
      };
      const list = raw.data?.result?.data ?? raw.result?.data ?? [];
      setOwners(list);
    } catch {
      setOwners([]);
    }
  };

  useEffect(() => {
    fetchConfigs();
    fetchOwners();
  }, []);

  const handleSaveDefault = async () => {
    const rate = Number(defaultRate);
    if (!Number.isFinite(rate) || rate <= 0 || rate > 1) {
      setError("Rate mặc định phải trong khoảng (0, 1].");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await walletService.upsertDefaultCommission({
        rate,
        note: defaultNote.trim() || undefined,
      });
      setSuccess("Đã cập nhật commission mặc định.");
      await fetchConfigs();
    } catch (e: unknown) {
      const err = e as ErrorWithResponse;
      setError(
        err?.response?.data?.message ??
          "Không thể cập nhật commission mặc định.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOwner = async () => {
    if (!selectedOwnerId) {
      setError("Vui lòng chọn OWNER.");
      return;
    }
    const rate = Number(ownerRate);
    if (!Number.isFinite(rate) || rate <= 0 || rate > 1) {
      setError("Rate theo OWNER phải trong khoảng (0, 1].");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await walletService.upsertOwnerCommission(selectedOwnerId, {
        rate,
        note: ownerNote.trim() || undefined,
      });
      setSuccess("Đã cập nhật commission theo OWNER.");
      await fetchConfigs();
    } catch (e: unknown) {
      const err = e as ErrorWithResponse;
      setError(
        err?.response?.data?.message ?? "Không thể cập nhật commission OWNER.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Cấu hình commission</h1>
        <p className="text-sm text-gray-600">
          Thiết lập commission mặc định và commission riêng cho OWNER.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">{success}</p>}

      <section className="bg-white border rounded-lg p-4 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold">Commission mặc định</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="number"
            min="0.0001"
            max="1"
            step="0.0001"
            value={defaultRate}
            onChange={(e) => setDefaultRate(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
            placeholder="Rate (vd: 0.1 = 10%)"
          />
          <input
            value={defaultNote}
            onChange={(e) => setDefaultNote(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
            placeholder="Ghi chú"
          />
        </div>
        <button
          onClick={handleSaveDefault}
          disabled={saving}
          className="px-3 py-2 rounded bg-blue-600 text-white text-sm disabled:opacity-50"
        >
          Cập nhật mặc định
        </button>
      </section>

      <section className="bg-white border rounded-lg p-4 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold">Commission theo OWNER</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select
            value={selectedOwnerId}
            onChange={(e) => setSelectedOwnerId(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="">Chọn OWNER</option>
            {owners.map((owner) => (
              <option key={owner.userId} value={owner.userId}>
                {owner.userName} - {owner.email}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="0.0001"
            max="1"
            step="0.0001"
            value={ownerRate}
            onChange={(e) => setOwnerRate(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
            placeholder="Rate (vd: 0.07 = 7%)"
          />
          <input
            value={ownerNote}
            onChange={(e) => setOwnerNote(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
            placeholder="Ghi chú"
          />
        </div>
        <button
          onClick={handleSaveOwner}
          disabled={saving}
          className="px-3 py-2 rounded bg-blue-600 text-white text-sm disabled:opacity-50"
        >
          Cập nhật theo OWNER
        </button>
      </section>

      <section className="bg-white border rounded-lg p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-3">Danh sách cấu hình hiện tại</h2>
        {loading ? (
          <p className="text-sm text-gray-600">Đang tải dữ liệu...</p>
        ) : (
          <div className="space-y-2 text-sm">
            <div className="border rounded p-3 bg-gray-50">
              <p className="font-medium">Default Commission</p>
              <p>Rate: {configs.defaultConfig?.rate ?? "-"} </p>
              <p>Note: {configs.defaultConfig?.note || "-"}</p>
            </div>
            {configs.ownerConfigs.map((item) => (
              <div key={item.commissionConfigId} className="border rounded p-3">
                <p className="font-medium">
                  {item.ownerName} ({item.ownerEmail})
                </p>
                <p>Rate: {item.rate}</p>
                <p>Note: {item.note || "-"}</p>
              </div>
            ))}
            {configs.ownerConfigs.length === 0 && (
              <p className="text-gray-600">Chưa có cấu hình riêng cho OWNER.</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default CommissionConfigManagementPage;

