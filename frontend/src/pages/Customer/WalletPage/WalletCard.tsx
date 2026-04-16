import { useState } from "react";
import { FaCoins } from "react-icons/fa";

interface WalletCardProps {
  totalBalance?: number;
  frozenAmount?: number;
  walletId?: string;
  walletLocked?: boolean;
  walletFrozenReason?: string;
  onRecharge?: () => void;
}

const WalletCard = ({
  totalBalance = 0,
  frozenAmount = 0,
  walletId = "",
  walletLocked = false,
  walletFrozenReason = "",
  onRecharge,
}: WalletCardProps) => {
  const [infoType, setInfoType] = useState<"about" | "rate" | null>(null);

  return (
    <div className="space-y-4">
      <div className="group relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#4da6ff] via-[#6bb5ff] to-[#4da6ff] rounded-xl opacity-20 group-hover:opacity-40 blur-xl transition-opacity duration-300"></div>

        <div className="relative bg-gradient-to-br from-[#4da6ff] via-[#3d8fdd] to-[#2d7fcb] rounded-xl p-6 text-white overflow-hidden shadow-2xl transform transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_20px_50px_rgba(77,166,255,0.4)] border border-white/20">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent"></div>

          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

          <div className="absolute top-0 right-0 w-48 h-40 opacity-15">
            <div className="absolute top-4 right-4 text-5xl font-black text-white/30 drop-shadow-lg tracking-tighter">
              Elingo
            </div>
          </div>

          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>

          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                                        linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: "20px 20px",
            }}
          ></div>

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-white/80 text-xs font-semibold mb-2 tracking-wider uppercase">
                  TỔNG TÀI KHOẢN
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-5xl font-black drop-shadow-lg tracking-tight">
                    {totalBalance.toLocaleString("vi-VN")}
                  </span>
                  <div className="relative">
                    <FaCoins className="text-yellow-400 text-3xl drop-shadow-lg animate-pulse" />
                    <div className="absolute inset-0 bg-yellow-400/50 blur-xl"></div>
                  </div>
                </div>
                <div className="mt-3 rounded-lg border border-white/30 bg-white/10 p-3 max-w-md">
                  <div className="mb-2 text-xs text-white/90">
                    Số dư khả dụng:{" "}
                    <b>{totalBalance.toLocaleString("vi-VN")} VNĐ</b> | Đang giữ:{" "}
                    <b>{frozenAmount.toLocaleString("vi-VN")} VNĐ</b>
                  </div>
                  <p className="text-[11px] uppercase tracking-wide text-white/70 mb-1">
                    Mã thẻ ví của bạn
                  </p>
                  <p className="text-xs md:text-sm font-semibold break-all text-white">
                    {walletId || "Chưa có mã ví"}
                  </p>
                  {walletLocked && (
                    <p className="mt-2 text-xs md:text-sm font-semibold text-red-200">
                      Đã bị khóa vui lòng liên hệ hệ thống
                      {walletFrozenReason ? `: ${walletFrozenReason}` : ""}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-black text-white/30 mb-2 drop-shadow-2xl tracking-tight">
                  Elingo
                </div>
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg border-2 border-white/30 transform group-hover:scale-110 transition-transform duration-300">
                    <svg
                      className="w-7 h-7 text-white drop-shadow"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div className="absolute inset-0 bg-green-400/50 blur-xl rounded-full"></div>
                </div>
              </div>
            </div>

            <div className="flex items-end justify-between mt-8 pt-4 border-t border-white/20 gap-4">
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setInfoType((prev) => (prev === "about" ? null : "about"))}
                  className="text-white/75 text-xs hover:text-white transition-colors text-left font-medium hover:underline block"
                >
                  Đồng Elingo là gì?
                </button>
                <button
                  type="button"
                  onClick={() => setInfoType((prev) => (prev === "rate" ? null : "rate"))}
                  className="text-white/75 text-xs hover:text-white transition-colors text-left font-medium hover:underline block"
                >
                  Giá trị quy đổi của Đồng Elingo?
                </button>
              </div>
              <button
                onClick={onRecharge}
                disabled={walletLocked}
                className="relative bg-white/25 hover:bg-white/35 backdrop-blur-md px-5 py-2.5 rounded-lg text-white font-bold transition-all duration-300 border border-white/40 shadow-lg hover:shadow-xl hover:scale-105 transform"
              >
                <span className="relative z-10">+ Nạp thêm</span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 rounded-lg opacity-0 hover:opacity-100 transition-opacity"></div>
              </button>
            </div>
            {infoType && (
              <div className="mt-3 rounded-lg border border-white/30 bg-white/15 backdrop-blur-sm p-3 text-xs text-white/95">
                {infoType === "about" ? (
                  <>
                    <p className="font-semibold mb-1">Đồng Elingo là gì?</p>
                    <p>
                      Đồng Elingo là đơn vị tiền trong ví Elingo, dùng để thanh toán
                      các dịch vụ trên hệ thống.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold mb-1">Giá trị quy đổi của Đồng Elingo</p>
                    <p>10.000 Đồng Elingo = 10.000 VNĐ</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletCard;
