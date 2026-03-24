import { useState } from "react";
import { walletService } from "../../../services/wallet/walletService";

type Props = {
  isDarkMode?: boolean;
};

const WalletWithdraw = ({ isDarkMode = false }: Props) => {
  const [amount, setAmount] = useState<number>(10000);
  const [bankCode, setBankCode] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const submit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await walletService.createWithdrawRequest({
        amount,
        bankCode,
        bankAccountNumber,
        bankAccountName,
      });
      setSuccess("Đã tạo yêu cầu rút tiền.");
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Không thể tạo yêu cầu rút tiền");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${isDarkMode ? "bg-[#2d7fcb] border-[#4da6ff]/30" : "bg-white border-gray-200"} rounded-xl border shadow-sm p-6`}>
      <h3 className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Rút tiền</h3>
      <p className={`text-sm mt-1 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
        Tạo yêu cầu rút tiền (ADMIN sẽ duyệt).
      </p>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="text-sm">
          <span className={isDarkMode ? "text-gray-200" : "text-gray-700"}>Số tiền</span>
          <input
            type="number"
            min={10000}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-[#4da6ff]"
          />
        </label>
        <label className="text-sm">
          <span className={isDarkMode ? "text-gray-200" : "text-gray-700"}>Mã ngân hàng</span>
          <input
            value={bankCode}
            onChange={(e) => setBankCode(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-[#4da6ff]"
          />
        </label>
        <label className="text-sm">
          <span className={isDarkMode ? "text-gray-200" : "text-gray-700"}>Số tài khoản</span>
          <input
            value={bankAccountNumber}
            onChange={(e) => setBankAccountNumber(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-[#4da6ff]"
          />
        </label>
        <label className="text-sm">
          <span className={isDarkMode ? "text-gray-200" : "text-gray-700"}>Tên chủ tài khoản</span>
          <input
            value={bankAccountName}
            onChange={(e) => setBankAccountName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-[#4da6ff]"
          />
        </label>
      </div>

      <div className="mt-4">
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        {success ? <p className="text-sm text-green-200">{success}</p> : null}
      </div>

      <button
        disabled={loading}
        onClick={submit}
        className="mt-4 px-4 py-2 rounded-lg bg-[#4da6ff] text-white font-medium hover:bg-[#3d8fdd] disabled:opacity-60"
      >
        {loading ? "Đang gửi..." : "Gửi yêu cầu rút"}
      </button>
    </div>
  );
};

export default WalletWithdraw;

