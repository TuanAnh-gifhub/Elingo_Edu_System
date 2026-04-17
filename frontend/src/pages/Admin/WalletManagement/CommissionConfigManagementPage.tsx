import { useEffect, useMemo, useState } from "react";
import {
  walletService,
  type ClassWalletFeeConfigResponse,
} from "../../../services/wallet/walletService";

type ErrorWithResponse = { response?: { data?: { message?: string } } };

const CommissionConfigManagementPage = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [config, setConfig] = useState<ClassWalletFeeConfigResponse | null>(null);
  const [feePercentInput, setFeePercentInput] = useState("0");
  const [noteInput, setNoteInput] = useState("");

  const teacherReceivePercent = useMemo(() => {
    const feePercent = Number(feePercentInput);
    if (!Number.isFinite(feePercent)) {
      return 100;
    }
    return Math.max(0, 100 - feePercent);
  }, [feePercentInput]);

  const fetchConfigs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await walletService.getAdminClassWalletFee();
      const result = response.data.result;
      setConfig(result);
      setFeePercentInput(String(result.feePercent ?? 0));
      setNoteInput(result.note || "");
    } catch (e: unknown) {
      const err = e as ErrorWithResponse;
      setError(
        err?.response?.data?.message ?? "Không thể tải cấu hình phí nền tảng.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleSave = async () => {
    const feePercent = Number(feePercentInput);
    if (!Number.isFinite(feePercent) || feePercent < 0 || feePercent > 100) {
      setError("Phí nền tảng phải nằm trong khoảng từ 0% đến 100%.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await walletService.updateAdminClassWalletFee({
        feePercent,
        note: noteInput.trim() || undefined,
      });
      setConfig(response.data.result);
      setSuccess("Đã cập nhật phí sử dụng nền tảng.");
    } catch (e: unknown) {
      const err = e as ErrorWithResponse;
      setError(
        err?.response?.data?.message ??
          "Không thể cập nhật phí sử dụng nền tảng.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Phí sử dụng nền tảng</h1>
        <p className="text-sm text-gray-600">
          Thiết lập phần trăm phí áp dụng khi giáo viên nhận tiền từ ví lớp.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">{success}</p>}

      <section className="bg-white border rounded-lg p-4 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold">Cấu hình phí ví lớp</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="text-sm text-gray-700">
            <span className="mb-1 block">Phí nền tảng (%)</span>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={feePercentInput}
              onChange={(e) => setFeePercentInput(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="Ví dụ: 10"
            />
          </label>
          <label className="text-sm text-gray-700">
            <span className="mb-1 block">Ghi chú</span>
            <input
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="Mô tả ngắn về cấu hình phí"
            />
          </label>
        </div>

        <div className="rounded border bg-gray-50 p-3 text-sm text-gray-700 space-y-1">
          <p>
            Giáo viên nhận: <strong>{teacherReceivePercent.toLocaleString("vi-VN")}%</strong>
          </p>
          <p>
            Hệ thống giữ lại: <strong>{Number(feePercentInput || 0).toLocaleString("vi-VN")}%</strong>
          </p>
          <p>
            Cập nhật gần nhất: {config?.updatedAt ? new Date(config.updatedAt).toLocaleString("vi-VN") : "-"}
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-3 py-2 rounded bg-blue-600 text-white text-sm disabled:opacity-50"
        >
          {saving ? "Đang lưu..." : "Lưu cấu hình phí"}
        </button>
      </section>

      {loading ? <p className="text-sm text-gray-600">Đang tải dữ liệu...</p> : null}
    </div>
  );
};

export default CommissionConfigManagementPage;

