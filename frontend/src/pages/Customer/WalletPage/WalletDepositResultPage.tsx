import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { walletService } from "../../../services/wallet/walletService";

type DepositUiStatus = "success" | "cancel" | "failed" | "pending";

type ErrorWithResponse = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

const normalizeStatus = (
  status: string | null,
  code: string | null,
  cancel: string | null,
): DepositUiStatus => {
  if (cancel === "true") return "cancel";
  if (code === "00") return "success";
  if (!status) return "pending";
  const normalized = status.toLowerCase();
  if (["success", "paid", "succeeded"].includes(normalized)) return "success";
  if (["cancel", "cancelled", "canceled"].includes(normalized)) return "cancel";
  if (["failed", "fail"].includes(normalized)) return "failed";
  return "pending";
};

const WalletDepositResultPage = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orderCode =
    searchParams.get("orderCode") ?? searchParams.get("order_code");
  const status = normalizeStatus(
    searchParams.get("status"),
    searchParams.get("code"),
    searchParams.get("cancel"),
  );

  useEffect(() => {
    const syncResult = async () => {
      if (!orderCode) {
        setError("Không tìm thấy mã giao dịch từ payOS.");
        setLoading(false);
        return;
      }
      try {
        await walletService.finalizeDepositResult(orderCode, status);
      } catch (e: unknown) {
        const error = e as ErrorWithResponse;
        setError(
          error?.response?.data?.message ??
            "Không thể đồng bộ trạng thái giao dịch với hệ thống.",
        );
      } finally {
        setLoading(false);
      }
    };

    syncResult();
  }, [orderCode, status]);

  const content = useMemo(() => {
    if (status === "success") {
      return {
        title: "Thanh toán đang được xác nhận",
        description:
          "Bạn đã quay lại từ payOS. Hệ thống sẽ cập nhật số dư ví ngay sau khi nhận webhook xác nhận thành công.",
        color: "text-emerald-700",
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
        iconClass: "text-emerald-600 bg-emerald-100",
        icon: "✓",
      };
    }
    if (status === "cancel") {
      return {
        title: "Bạn đã hủy giao dịch",
        description:
          "Giao dịch nạp ví đã được hủy. Bạn có thể tạo lại link thanh toán khi cần.",
        color: "text-amber-700",
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
        iconClass: "text-amber-600 bg-amber-100",
        icon: "!",
      };
    }
    if (status === "failed") {
      return {
        title: "Giao dịch thất bại",
        description: "payOS báo giao dịch không thành công. Vui lòng thử lại sau.",
        color: "text-red-700",
        badgeClass: "bg-red-50 text-red-700 border-red-200",
        iconClass: "text-red-600 bg-red-100",
        icon: "✕",
      };
    }
    return {
      title: "Đang xử lý kết quả",
      description:
        "Hệ thống chưa nhận được trạng thái rõ ràng từ payOS. Vui lòng kiểm tra lịch sử giao dịch.",
      color: "text-slate-700",
      badgeClass: "bg-slate-50 text-slate-700 border-slate-200",
      iconClass: "text-slate-600 bg-slate-100",
      icon: "...",
    };
  }, [status]);

  return (
    <div className="min-h-[70vh] bg-slate-50 py-10 px-4">
      <div className="mx-auto w-full max-w-3xl">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-[#4da6ff] to-[#3d8fdd] px-6 py-5 text-white">
            <p className="text-sm opacity-90">Kết quả giao dịch nạp ví</p>
            <h2 className="text-xl md:text-2xl font-bold mt-1">
              Elingo Wallet
            </h2>
          </div>

          <div className="p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div
                className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg ${content.iconClass}`}
              >
                {content.icon}
              </div>
              <div className="flex-1">
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${content.badgeClass}`}
                >
                  PAYOS RETURN
                </span>
                <h1 className={`text-2xl font-bold mt-3 ${content.color}`}>
                  {content.title}
                </h1>
                <p className="text-slate-600 mt-2 leading-relaxed">
                  {content.description}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">
                Thông tin giao dịch
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <div className="text-sm text-slate-600">Mã giao dịch</div>
                <code className="rounded bg-white border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-800">
                  {orderCode || "Không xác định"}
                </code>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-800 mb-2">
                Trạng thái đồng bộ hệ thống
              </p>
              {loading && (
                <p className="text-sm text-slate-600">
                  Đang đồng bộ dữ liệu từ backend...
                </p>
              )}
              {!loading && !error && (
                <p className="text-sm text-emerald-700">
                  Kết quả giao dịch đã được ghi nhận. Nếu trạng thái là thành
                  công, số dư ví sẽ được cập nhật sau bước xác nhận cuối.
                </p>
              )}
              {!loading && error && (
                <p className="text-sm text-red-700">Lỗi đồng bộ: {error}</p>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/wallet/recharge"
                className="px-4 py-2 rounded-md bg-slate-900 text-white hover:bg-slate-800"
              >
                Nạp thêm giao dịch mới
              </Link>
              <Link
                to="/wallet"
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
              >
                Về ví cá nhân
              </Link>
              <Link
                to="/wallet/history"
                className="px-4 py-2 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Xem lịch sử giao dịch
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-4 text-xs text-slate-500 px-1">
          Nếu đã chuyển tiền nhưng chưa thấy số dư thay đổi, vui lòng chờ thêm
          vài giây để hệ thống nhận xác nhận cuối từ cổng thanh toán.
        </div>
      </div>
    </div>
  );
};

export default WalletDepositResultPage;

