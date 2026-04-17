import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { paymentService } from "../../../services/payments/paymentService";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

const BookingPaymentResultPage = () => {
  const navigate = useNavigate();
  const query = useQuery();

  const orderCode = query.get("orderCode") || "";
  const status = query.get("status") || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [mode, setMode] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        if (!orderCode) throw new Error("Thiếu orderCode");
        const res = await paymentService.getBookingPaymentResult({ orderCode, status });
        const result = res.data.result;
        if (cancelled) return;
        setMode(result.mode);
        setMessage(result.message || null);
        setBookingId(result.bookingId || null);
        setError(null);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Không thể đồng bộ kết quả thanh toán");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [orderCode, status]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-lg bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <h1 className="text-xl font-bold text-gray-900">Kết quả thanh toán</h1>
        <p className="text-sm text-gray-600 mt-1">
          Mã đơn: <span className="font-mono">{orderCode || "-"}</span>
        </p>

        <div className="mt-4">
          {loading ? (
            <p className="text-sm text-gray-700">Đang xử lý...</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : bookingId ? (
            <div className="text-sm text-green-700">
              <p className="font-semibold">Thanh toán thành công.</p>
              <p>
                BookingId: <span className="font-mono">{bookingId}</span>
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-700">
              Trạng thái: <span className="font-semibold">{mode || "UNKNOWN"}</span>
              {message ? <span className="block mt-1 text-gray-600">{message}</span> : null}
            </p>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 rounded-lg bg-[#4da6ff] text-white font-medium hover:bg-[#3d8fdd]"
          >
            Trang chủ
          </button>
          <button
            onClick={() => navigate("/wallet")}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
          >
            Về Ví
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingPaymentResultPage;

