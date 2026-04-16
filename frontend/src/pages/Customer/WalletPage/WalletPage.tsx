import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import WalletCard from "./WalletCard";
import WalletHistory from "./WalletHistory";
import WalletPromotion from "./WalletPromotion";
import ParallaxBackground from "../LandingPage/ParallaxBackground";
import Footer from "../../../components/Footer/Footer";
import {
  FaCoins,
  FaMobileAlt,
  FaGift,
  FaHistory,
  FaHeadphonesAlt,
  FaChartLine,
} from "react-icons/fa";
import {
  walletService,
  type CommissionInfoResponse,
  type EscrowItemResponse,
  type EscrowSummaryResponse,
  type RevenueOverviewResponse,
  type WithdrawRequestItemResponse,
} from "../../../services/wallet/walletService";
import { userService, type UserResponse } from "../../../services/usersService";

type WalletFeature =
  | "overview"
  | "history"
  | "promotion"
  | "recharge"
  | "withdraw"
  | "help"
  | "revenue";

type ErrorWithResponse = { response?: { data?: { message?: string } } };
const MIN_RECHARGE_AMOUNT = 10000;

const WalletPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [totalBalance, setTotalBalance] = useState(0);
  const [walletId, setWalletId] = useState<string>("");
  const [frozenAmount, setFrozenAmount] = useState(0);
  const [walletLocked, setWalletLocked] = useState(false);
  const [walletFrozenReason, setWalletFrozenReason] = useState<string>("");

  const [userName, setUserName] = useState<string>("");
  const [userInfo, setUserInfo] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const stored = localStorage.getItem("landing_dark_mode");
    return stored === "true";
  });

  const [rechargeAmount, setRechargeAmount] = useState("10000");
  const [rechargeLoading, setRechargeLoading] = useState(false);
  const [rechargeError, setRechargeError] = useState<string | null>(null);

  const [withdrawAmount, setWithdrawAmount] = useState("10000");
  const [bankCode, setBankCode] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null);
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequestItemResponse[]>([]);

  const [commissionInfo, setCommissionInfo] = useState<CommissionInfoResponse | null>(null);
  const [revenueInfo, setRevenueInfo] = useState<RevenueOverviewResponse | null>(null);
  const [escrowInfo, setEscrowInfo] = useState<EscrowSummaryResponse | null>(null);
  const [ownerFinanceError, setOwnerFinanceError] = useState<string | null>(null);

  const isOwner = (userRole ?? "").toUpperCase().includes("OWNER");

  useEffect(() => {
    const handleDarkModeChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ isDarkMode: boolean }>;
      setIsDarkMode(customEvent.detail.isDarkMode);
    };

    window.addEventListener("darkModeChanged", handleDarkModeChange);
    return () => window.removeEventListener("darkModeChanged", handleDarkModeChange);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const res = await userService.getMe();
        if (cancelled) return;
        const u: UserResponse = res.result;
        setUserName(u.userName || u.email || "Người dùng");
        setUserRole(u.role || "");

        const infoParts: string[] = [];
        if (u.role) infoParts.push(u.role);
        if (u.email) infoParts.push(u.email);
        setUserInfo(infoParts.join(" · "));
      } catch {
        if (!cancelled) {
          setUserName("Elingo User");
          setUserInfo("");
          setUserRole("");
        }
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchWallet = async () => {
    try {
      const res = await walletService.getMyWallet();
      const wallet = res.data.result;
      const balance = Number(wallet.balance ?? 0);
      setTotalBalance(balance);
      setFrozenAmount(Number(wallet.frozenAmount ?? 0));
      setWalletId(wallet.walletId ?? "");
      setWalletLocked(Boolean(wallet.isFrozen));
      setWalletFrozenReason(wallet.frozenReason ?? "");
    } catch (error) {
      console.error("Không thể tải thông tin ví", error);
    }
  };

  const fetchWithdrawRequests = async () => {
    try {
      const res = await walletService.getMyWithdrawRequests(1, 10);
      setWithdrawRequests(res.data.result.data ?? []);
    } catch (error) {
      console.error("Không thể tải danh sách rút tiền", error);
    }
  };

  const fetchOwnerFinance = async () => {
    if (!isOwner) return;
    try {
      const [commission, revenue, escrow] = await Promise.all([
        walletService.getMyCommission(),
        walletService.getMyRevenue(),
        walletService.getMyPendingEscrow(),
      ]);
      setCommissionInfo(commission.data.result);
      setRevenueInfo(revenue.data.result);
      setEscrowInfo(escrow.data.result);
      setOwnerFinanceError(null);
    } catch (error) {
      console.error("Không thể tải thông tin commission/revenue", error);
      setOwnerFinanceError("Không thể tải dữ liệu commission/revenue.");
    }
  };

  useEffect(() => {
    fetchWallet();
    fetchWithdrawRequests();
    if (isOwner) {
      fetchOwnerFinance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner]);

  useEffect(() => {
    const amountParam = new URLSearchParams(location.search).get("amount");
    if (!amountParam) {
      return;
    }

    const parsedAmount = Number(amountParam);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    const roundedAmount = Math.ceil(parsedAmount / 1000) * 1000;
    setRechargeAmount(String(Math.max(MIN_RECHARGE_AMOUNT, roundedAmount)));
  }, [location.search]);

    // Xác định tính năng hiện tại dựa trên URL
    const getCurrentFeature = (): WalletFeature => {
        const path = location.pathname;
        if (path.includes("/promotion")) return "promotion";
        if (path.includes("/history")) return "history";
        if (path.includes("/recharge")) return "recharge";
        if (path.includes("/withdraw")) return "withdraw";
        if (path.includes("/help")) return "help";
        if (path.includes("/revenue")) return "revenue";
        return "overview";
    };

    const activeFeature = getCurrentFeature();

    const categories = [
        {
            icon: FaCoins,
            label: "Nạp Đồng Elingo",
            color: "text-yellow-500",
            bgColor: "bg-yellow-50",
            feature: "recharge" as WalletFeature,
            onClick: () => {
                navigate("/wallet/recharge");
            },
        },
        {
            icon: FaMobileAlt,
            label: "Rút tiền",
            color: "text-blue-500",
            bgColor: "bg-blue-50",
            feature: "withdraw" as WalletFeature,
            onClick: () => {
                navigate("/wallet/withdraw");
            },
        },
        {
            icon: FaGift,
            label: "Đổi mã khuyến mãi",
            color: "text-green-500",
            bgColor: "bg-green-50",
            feature: "promotion" as WalletFeature,
            onClick: () => {
                navigate("/wallet/promotion");
            },
        },
        {
            icon: FaHistory,
            label: "Lịch sử giao dịch",
            color: "text-gray-500",
            bgColor: "bg-gray-50",
            feature: "history" as WalletFeature,
            onClick: () => {
                navigate("/wallet/history");
            },
        },
        {
            icon: FaHeadphonesAlt,
            label: "Trợ giúp",
            color: "text-gray-700",
            bgColor: "bg-gray-50",
            feature: "help" as WalletFeature,
            onClick: () => {
                navigate("/wallet/help");
            },
        },
        ...(isOwner
          ? [
              {
                icon: FaChartLine,
                label: "Doanh thu",
                color: "text-purple-500",
                bgColor: "bg-purple-50",
                feature: "revenue" as WalletFeature,
                onClick: () => {
                  navigate("/wallet/revenue");
                },
              },
            ]
          : []),
    ];

  const handleRecharge = () => {
    navigate("/wallet/recharge");
  };

  const handleCreateDepositLink = async () => {
    if (walletLocked) {
      setRechargeError("Ví bạn tạm thời bị khóa.");
      return;
    }
    const amount = Number(rechargeAmount);
    if (!Number.isFinite(amount) || amount < 10000) {
      setRechargeError("Số tiền nạp tối thiểu là 10,000 VNĐ.");
      return;
    }

    setRechargeLoading(true);
    setRechargeError(null);
    try {
      const res = await walletService.createDepositLink({ amount });
      const paymentUrl = res.data.result.paymentUrl;
      if (!paymentUrl) {
        throw new Error("PAYOS checkout URL is missing");
      }
      window.location.href = paymentUrl;
    } catch (error: unknown) {
      const err = error as ErrorWithResponse;
      setRechargeError(
        walletLocked
          ? "Ví bạn tạm thời bị khóa."
          : err?.response?.data?.message ?? "Không thể tạo link thanh toán payOS. Vui lòng thử lại.",
      );
    } finally {
      setRechargeLoading(false);
    }
  };

  const handleCreateWithdrawRequest = async () => {
    const amount = Number(withdrawAmount);
    if (!Number.isFinite(amount) || amount < 1000) {
      setWithdrawError("Số tiền rút tối thiểu là 1,000 VNĐ.");
      return;
    }
    if (!bankCode.trim() || !bankAccountNumber.trim() || !bankAccountName.trim()) {
      setWithdrawError("Vui lòng nhập đầy đủ thông tin ngân hàng.");
      return;
    }

    setWithdrawLoading(true);
    setWithdrawError(null);
    setWithdrawSuccess(null);
    try {
      await walletService.createWithdrawRequest({
        amount,
        bankCode: bankCode.trim(),
        bankAccountNumber: bankAccountNumber.trim(),
        bankAccountName: bankAccountName.trim(),
      });
      setWithdrawSuccess("Tạo yêu cầu rút tiền thành công. Vui lòng chờ ADMIN duyệt.");
      setWithdrawAmount("10000");
      await fetchWallet();
      await fetchWithdrawRequests();
    } catch (error: unknown) {
      const err = error as ErrorWithResponse;
      setWithdrawError(
        err?.response?.data?.message ?? "Không thể tạo yêu cầu rút tiền. Vui lòng thử lại.",
      );
    } finally {
      setWithdrawLoading(false);
    }
  };

    // Render tính năng dựa trên activeFeature
    const renderFeature = () => {
        switch (activeFeature) {
            case "promotion":
                return <WalletPromotion isDarkMode={isDarkMode} />;
            case "history":
                return (
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Lịch sử giao dịch</h2>
                        </div>
                        <WalletHistory showFull={true} isDarkMode={isDarkMode} />
                    </div>
                );
            case "recharge":
                return (
                    <div className={`${isDarkMode ? 'bg-[#2d7fcb] border-[#4da6ff]/30' : 'bg-white border-gray-200'} rounded-xl border shadow-sm p-8`}>
                        <FaCoins className={`${isDarkMode ? 'text-yellow-400' : 'text-yellow-500'} text-4xl mb-4`} />
                        <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Nạp tiền vào ví</h3>
                        <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            Tạo link thanh toán payOS và chuyển hướng đến trang thanh toán.
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                            {[10000, 20000, 50000, 100000].map((value) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setRechargeAmount(String(value))}
                                    className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                                        rechargeAmount === String(value)
                                            ? "bg-blue-600 text-white"
                                            : isDarkMode
                                                ? "bg-[#3a8bd8] text-white hover:bg-[#4da6ff]"
                                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    }`}
                                >
                                    {value.toLocaleString("vi-VN")} VNĐ
                                </button>
                            ))}
                        </div>

                        <label className={`block text-sm mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                            Số tiền nạp (VNĐ)
                        </label>
                        <input
                            type="number"
                            min={10000}
                            step={1000}
                            value={rechargeAmount}
                            onChange={(e) => setRechargeAmount(e.target.value)}
                            className={`w-full rounded-md border px-3 py-2 mb-4 ${
                                isDarkMode
                                    ? "bg-[#3a8bd8] border-[#5ab4ff] text-white"
                                    : "bg-white border-gray-300 text-gray-900"
                            }`}
                        />

                        {rechargeError && (
                            <p className="text-sm text-red-500 mb-4">{rechargeError}</p>
                        )}

                        <button
                            type="button"
                            onClick={handleCreateDepositLink}
                            disabled={rechargeLoading}
                            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {rechargeLoading ? "Đang tạo link..." : "Nạp tiền với payOS"}
                        </button>
                    </div>
                );
            case "withdraw":
                return (
                    <div className={`${isDarkMode ? 'bg-[#2d7fcb] border-[#4da6ff]/30' : 'bg-white border-gray-200'} rounded-xl border shadow-sm p-8`}>
                        <FaCoins className={`${isDarkMode ? 'text-[#6bb5ff]' : 'text-[#4da6ff]'} text-4xl mb-4`} />
                        <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Rút tiền về ngân hàng</h3>
                        <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            Tạo yêu cầu rút tiền. Hệ thống sẽ chờ ADMIN duyệt trước khi hoàn tất.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className={`block text-sm mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                    Số tiền rút (VNĐ)
                                </label>
                                <input
                                    type="number"
                                    min={1000}
                                    step={1000}
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                    className={`w-full rounded-md border px-3 py-2 ${
                                        isDarkMode
                                            ? "bg-[#3a8bd8] border-[#5ab4ff] text-white"
                                            : "bg-white border-gray-300 text-gray-900"
                                    }`}
                                />
                            </div>
                            <div>
                                <label className={`block text-sm mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                    Mã ngân hàng
                                </label>
                                <input
                                    value={bankCode}
                                    onChange={(e) => setBankCode(e.target.value)}
                                    placeholder="VD: VCB"
                                    className={`w-full rounded-md border px-3 py-2 ${
                                        isDarkMode
                                            ? "bg-[#3a8bd8] border-[#5ab4ff] text-white"
                                            : "bg-white border-gray-300 text-gray-900"
                                    }`}
                                />
                            </div>
                            <div>
                                <label className={`block text-sm mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                    Số tài khoản
                                </label>
                                <input
                                    value={bankAccountNumber}
                                    onChange={(e) => setBankAccountNumber(e.target.value)}
                                    className={`w-full rounded-md border px-3 py-2 ${
                                        isDarkMode
                                            ? "bg-[#3a8bd8] border-[#5ab4ff] text-white"
                                            : "bg-white border-gray-300 text-gray-900"
                                    }`}
                                />
                            </div>
                            <div>
                                <label className={`block text-sm mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                    Tên chủ tài khoản
                                </label>
                                <input
                                    value={bankAccountName}
                                    onChange={(e) => setBankAccountName(e.target.value)}
                                    className={`w-full rounded-md border px-3 py-2 ${
                                        isDarkMode
                                            ? "bg-[#3a8bd8] border-[#5ab4ff] text-white"
                                            : "bg-white border-gray-300 text-gray-900"
                                    }`}
                                />
                            </div>
                        </div>

                        {withdrawError && <p className="text-sm text-red-500 mb-3">{withdrawError}</p>}
                        {withdrawSuccess && <p className="text-sm text-green-500 mb-3">{withdrawSuccess}</p>}

                        <button
                            type="button"
                            onClick={handleCreateWithdrawRequest}
                            disabled={withdrawLoading}
                            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {withdrawLoading ? "Đang gửi yêu cầu..." : "Tạo yêu cầu rút tiền"}
                        </button>

                        <div className="mt-6">
                            <h4 className={`text-base font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                Yêu cầu rút tiền gần đây
                            </h4>
                            <div className="space-y-2">
                                {withdrawRequests.map((req) => (
                                    <div
                                        key={req.withdrawRequestId}
                                        className={`${isDarkMode ? 'bg-[#3a8bd8]/40 border-[#4da6ff]/30 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} border rounded-md p-3 text-sm`}
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <p>
                                                <b>{Number(req.amount).toLocaleString("vi-VN")} VNĐ</b> - {req.status}
                                            </p>
                                            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-500'}>
                                                {new Date(req.createdAt).toLocaleString("vi-VN")}
                                            </p>
                                        </div>
                                        <p className={isDarkMode ? 'text-gray-300 mt-1' : 'text-gray-600 mt-1'}>
                                            {req.bankCode} - {req.bankAccountNumber} - {req.bankAccountName}
                                        </p>
                                        {req.processedAt && (
                                            <p className={isDarkMode ? "text-gray-300 mt-1" : "text-gray-600 mt-1"}>
                                                Xử lý lúc: {new Date(req.processedAt).toLocaleString("vi-VN")}
                                                {req.processedBy ? ` - bởi ${req.processedBy}` : ""}
                                            </p>
                                        )}
                                        {req.adminNote && (
                                            <p className="mt-1 text-orange-400">Ghi chú ADMIN: {req.adminNote}</p>
                                        )}
                                    </div>
                                ))}
                                {withdrawRequests.length === 0 && (
                                    <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                                        Chưa có yêu cầu rút tiền nào.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                );
            case "help":
                return (
                    <div className={`${isDarkMode ? 'bg-[#2d7fcb] border-[#4da6ff]/30' : 'bg-white border-gray-200'} rounded-xl border shadow-sm p-8 text-center`}>
                        <FaHeadphonesAlt className={`${isDarkMode ? 'text-[#6bb5ff]' : 'text-[#4da6ff]'} text-5xl mx-auto mb-4`} />
                        <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Trợ giúp</h3>
                        <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Tính năng đang được phát triển</p>
                    </div>
                );
            case "revenue":
                if (!isOwner) {
                    return (
                        <div className={`${isDarkMode ? 'bg-[#2d7fcb] border-[#4da6ff]/30' : 'bg-white border-gray-200'} rounded-xl border shadow-sm p-8 text-center`}>
                            <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Doanh thu</h3>
                            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                                Tính năng này chỉ dành cho tài khoản OWNER.
                            </p>
                        </div>
                    );
                }
                return (
                    <div className={`${isDarkMode ? 'bg-[#2d7fcb] border-[#4da6ff]/30' : 'bg-white border-gray-200'} rounded-xl border shadow-sm p-5 mb-6`}>
                        <h2 className={`text-lg font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Commission & Doanh thu (OWNER)
                        </h2>
                        {ownerFinanceError && (
                            <p className="text-sm text-red-500 mb-3">{ownerFinanceError}</p>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                            <div className={`rounded-md p-3 ${isDarkMode ? "bg-[#3a8bd8]/40 text-white" : "bg-gray-50 text-gray-900"}`}>
                                <p className="opacity-80">Tỷ lệ commission</p>
                                <p className="font-semibold">
                                    {commissionInfo ? `${(Number(commissionInfo.rate || 0) * 100).toFixed(2)}%` : "-"}
                                </p>
                                <p className="text-xs opacity-75">
                                    {commissionInfo
                                        ? ((commissionInfo.custom ?? commissionInfo.isCustom)
                                            ? "Config riêng OWNER"
                                            : "Config mặc định hệ thống")
                                        : ""}
                                </p>
                            </div>
                            <div className={`rounded-md p-3 ${isDarkMode ? "bg-[#3a8bd8]/40 text-white" : "bg-gray-50 text-gray-900"}`}>
                                <p className="opacity-80">Tổng doanh thu</p>
                                <p className="font-semibold">
                                    {Number(revenueInfo?.totalIncome ?? 0).toLocaleString("vi-VN")} VNĐ
                                </p>
                            </div>
                            <div className={`rounded-md p-3 ${isDarkMode ? "bg-[#3a8bd8]/40 text-white" : "bg-gray-50 text-gray-900"}`}>
                                <p className="opacity-80">Tổng commission đã trả</p>
                                <p className="font-semibold">
                                    {Number(revenueInfo?.totalCommission ?? 0).toLocaleString("vi-VN")} VNĐ
                                </p>
                            </div>
                            <div className={`rounded-md p-3 ${isDarkMode ? "bg-[#3a8bd8]/40 text-white" : "bg-gray-50 text-gray-900"}`}>
                                <p className="opacity-80">Thực nhận (net)</p>
                                <p className="font-semibold">
                                    {Number(revenueInfo?.netRevenue ?? 0).toLocaleString("vi-VN")} VNĐ
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 text-sm">
                            <div className={`rounded-md p-3 ${isDarkMode ? "bg-[#3a8bd8]/40 text-white" : "bg-gray-50 text-gray-900"}`}>
                                <p className="opacity-80">Hệ thống đang giữ</p>
                                <p className="font-semibold">
                                    {Number(escrowInfo?.totalHoldingAmount ?? 0).toLocaleString("vi-VN")} VNĐ
                                </p>
                            </div>
                            <div className={`rounded-md p-3 ${isDarkMode ? "bg-[#3a8bd8]/40 text-white" : "bg-gray-50 text-gray-900"}`}>
                                <p className="opacity-80">Commission sẽ trừ</p>
                                <p className="font-semibold">
                                    {Number(escrowInfo?.totalCommissionAmount ?? 0).toLocaleString("vi-VN")} VNĐ
                                </p>
                            </div>
                            <div className={`rounded-md p-3 ${isDarkMode ? "bg-[#3a8bd8]/40 text-white" : "bg-gray-50 text-gray-900"}`}>
                                <p className="opacity-80">Dự kiến cộng ví</p>
                                <p className="font-semibold">
                                    {Number(escrowInfo?.totalNetAmount ?? 0).toLocaleString("vi-VN")} VNĐ
                                </p>
                            </div>
                        </div>
                        <div className="mt-3 space-y-2">
                            {(escrowInfo?.items ?? []).slice(0, 5).map((item: EscrowItemResponse) => (
                                <div
                                    key={item.bookingId}
                                    className={`rounded-md p-3 border ${isDarkMode ? "bg-[#3a8bd8]/20 border-[#4da6ff]/30 text-white" : "bg-gray-50 border-gray-200 text-gray-900"}`}
                                >
                                    <p className="text-sm font-semibold">Booking: {item.bookingId}</p>
                                    <p className="text-xs mt-1">
                                        Giữ: {Number(item.grossAmount).toLocaleString("vi-VN")} VNĐ | Commission:{" "}
                                        {(Number(item.commissionRate ?? 0) * 100).toFixed(2)}% (
                                        {Number(item.commissionAmount).toLocaleString("vi-VN")} VNĐ) | Còn lại:{" "}
                                        {Number(item.netAmount).toLocaleString("vi-VN")} VNĐ
                                    </p>
                                    <p className="text-xs mt-1">
                                        Dự kiến cộng ví:{" "}
                                        {item.expectedReleaseAt
                                            ? new Date(item.expectedReleaseAt).toLocaleString("vi-VN")
                                            : "-"}
                                    </p>
                                </div>
                            ))}
                            {(escrowInfo?.items?.length ?? 0) === 0 && (
                                <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                                    Hiện chưa có khoản tiền nào đang giữ trong escrow.
                                </p>
                            )}
                        </div>
                    </div>
                );
            default:
                return (
                    <>
                        {/* Account Details and Transaction History */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left Column - Account Details */}
                            <div>
                                <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Chi tiết tài khoản</h2>
                                <WalletCard
                                    totalBalance={totalBalance}
                                    frozenAmount={frozenAmount}
                                    walletId={walletId}
                                    walletLocked={walletLocked}
                                    walletFrozenReason={walletFrozenReason}
                                    onRecharge={handleRecharge}
                                />
                            </div>

                            {/* Right Column - Transaction History */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Lịch sử giao dịch</h2>
                                    <button
                                        onClick={() => navigate("/wallet/history")}
                                        className="text-[#4da6ff] text-sm font-medium hover:underline"
                                    >
                                        Xem tất cả
                                    </button>
                                </div>
                                <WalletHistory showFull={false} isDarkMode={isDarkMode} />
                            </div>
                        </div>
                    </>
                );
        }
    };

    return (
        <div className="relative min-h-screen w-full" style={{ background: isDarkMode ? '#1a1a2e' : '#f5f7fa' }}>
            <ParallaxBackground isDarkMode={isDarkMode} />

            {/* Header */}
            <div className="bg-gradient-to-r from-[#4da6ff] to-[#3d8fdd] text-white py-4 px-6 relative z-10 shadow-md">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold">
                            Xin chào, {userName || "Elingo User"}
                            {userInfo && <span className="text-sm text-gray-200"> ({userInfo})</span>}
                        </h2>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
                {/* Categories Section */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Danh mục</h2>
                        {activeFeature !== "overview" && (
                            <button
                                onClick={() => navigate("/wallet")}
                                className="text-[#4da6ff] text-sm font-medium hover:underline flex items-center gap-1"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Về trang chủ ví
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                        {categories.map((category, index) => {
                            const Icon = category.icon;
                            const isActive = activeFeature === category.feature;
                            const darkBgColor = isDarkMode
                                ? category.bgColor.replace('50', '800').replace('bg-', 'bg-')
                                : category.bgColor;
                            // Điều chỉnh màu icon cho dark mode
                            const iconColor = isDarkMode
                                ? category.color.replace('500', '400').replace('700', '300')
                                : category.color;
                            return (
                                <button
                                    key={index}
                                    onClick={category.onClick}
                                    className={`${darkBgColor} ${isActive ? "ring-2 ring-[#4da6ff] ring-offset-2" : ""} ${isDarkMode ? 'border border-[#4da6ff]/30' : ''} rounded-lg p-4 hover:shadow-md transition-all duration-200 flex flex-col items-center gap-2 group`}
                                >
                                    <div className={`${iconColor} text-2xl group-hover:scale-110 transition-transform`}>
                                        <Icon />
                                    </div>
                                    <span className={`text-xs font-medium text-center ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                        {category.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Feature Content */}
                {renderFeature()}
            </div>

            {/* Footer */}
            <Footer isDarkMode={isDarkMode} />
        </div>
    );
};

export default WalletPage;
