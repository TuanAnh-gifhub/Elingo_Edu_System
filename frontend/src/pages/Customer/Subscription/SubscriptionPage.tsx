import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  subscriptionService,
  type PackageResponse,
  type UserSubscriptionResponse,
} from "../../../services/subscription/subscriptionService";
import ParallaxBackground from "../LandingPage/ParallaxBackground";
import Footer from "../../../components/Footer/Footer";
import { useAuth } from "../../../context/AuthContext";

type ErrorWithResponse = { response?: { data?: { message?: string } } };

const formatCurrency = (amount: number) =>
  Number(amount).toLocaleString("vi-VN") + " ₫";

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const statusConfig: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  ACTIVE: { label: "Đang hoạt động", color: "text-emerald-700", bgColor: "bg-emerald-100" },
  EXPIRED: { label: "Hết hạn", color: "text-gray-600", bgColor: "bg-gray-100" },
  CANCELLED: { label: "Đã hủy", color: "text-red-600", bgColor: "bg-red-100" },
};

const PackageCard = ({
  pkg,
  onPurchase,
  purchasing,
  isDarkMode,
}: {
  pkg: PackageResponse;
  onPurchase: (id: string) => void;
  purchasing: string | null;
  isDarkMode: boolean;
}) => {
  const isPurchasing = purchasing === pkg.packageId;

  return (
    <div
      className={`relative rounded-2xl border transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 overflow-hidden ${
        isDarkMode
          ? "bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-[#4da6ff]/20 text-white"
          : "bg-white border-gray-200 text-gray-900"
      }`}
    >
      {/* Top color strip */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#4da6ff] to-[#7c3aed]" />

      <div className="p-6">
        {/* Name */}
        <h3
          className={`text-xl font-bold mb-1 ${
            isDarkMode ? "text-white" : "text-gray-900"
          }`}
        >
          {pkg.name}
        </h3>

        {/* Description */}
        {pkg.description && (
          <p
            className={`text-sm mb-4 min-h-[40px] ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            {pkg.description}
          </p>
        )}

        {/* Price */}
        <div className="mb-4">
          <span className="text-3xl font-extrabold bg-gradient-to-r from-[#4da6ff] to-[#7c3aed] bg-clip-text text-transparent">
            {formatCurrency(pkg.price)}
          </span>
          <span
            className={`text-sm ml-2 ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            / {pkg.durationDays} ngày
          </span>
        </div>

        {/* Features */}
        <ul className="space-y-2 mb-6">
          <li className="flex items-center gap-2 text-sm">
            <span className="text-emerald-500 font-bold">✓</span>
            <span className={isDarkMode ? "text-gray-300" : "text-gray-700"}>
              Hiệu lực {pkg.durationDays} ngày
            </span>
          </li>
          {pkg.maxClassesPerMonth != null && (
            <li className="flex items-center gap-2 text-sm">
              <span className="text-emerald-500 font-bold">✓</span>
              <span className={isDarkMode ? "text-gray-300" : "text-gray-700"}>
                Tối đa {pkg.maxClassesPerMonth} lớp học/tháng
              </span>
            </li>
          )}
          {pkg.maxCourses != null && (
            <li className="flex items-center gap-2 text-sm">
              <span className="text-emerald-500 font-bold">✓</span>
              <span className={isDarkMode ? "text-gray-300" : "text-gray-700"}>
                Truy cập {pkg.maxCourses} khóa học
              </span>
            </li>
          )}
          {pkg.maxClassesPerMonth == null && pkg.maxCourses == null && (
            <li className="flex items-center gap-2 text-sm">
              <span className="text-emerald-500 font-bold">✓</span>
              <span className={isDarkMode ? "text-gray-300" : "text-gray-700"}>
                Không giới hạn lớp học &amp; khóa học
              </span>
            </li>
          )}
          <li className="flex items-center gap-2 text-sm">
            <span className="text-emerald-500 font-bold">✓</span>
            <span className={isDarkMode ? "text-gray-300" : "text-gray-700"}>
              Thanh toán qua ví Elingo
            </span>
          </li>
        </ul>

        {/* Buy Button */}
        <button
          onClick={() => onPurchase(pkg.packageId)}
          disabled={isPurchasing}
          className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[#4da6ff] to-[#7c3aed] hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-[#4da6ff]/30"
        >
          {isPurchasing ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Đang xử lý...
            </span>
          ) : (
            "Mua ngay"
          )}
        </button>
      </div>
    </div>
  );
};

const SubscriptionPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [packages, setPackages] = useState<PackageResponse[]>([]);
  const [mySubscriptions, setMySubscriptions] = useState<UserSubscriptionResponse[]>([]);
  const [activeSubscription, setActiveSubscription] = useState<UserSubscriptionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);
  const [tab, setTab] = useState<"packages" | "history">("packages");

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("landing_dark_mode") === "true";
  });

  useEffect(() => {
    const handler = (e: Event) => {
      const ev = e as CustomEvent<{ isDarkMode: boolean }>;
      setIsDarkMode(ev.detail.isDarkMode);
    };
    window.addEventListener("darkModeChanged", handler);
    return () => window.removeEventListener("darkModeChanged", handler);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Always fetch public packages
      const pkgRes = await subscriptionService.getActivePackages().catch(() => null);
      if (pkgRes) setPackages(pkgRes.data.result ?? []);

      // Only fetch user-specific data when authenticated
      if (isAuthenticated) {
        const [mySubRes, activeRes] = await Promise.allSettled([
          subscriptionService.getMySubscriptions(),
          subscriptionService.getMyActiveSubscription(),
        ]);
        if (mySubRes.status === "fulfilled")
          setMySubscriptions(mySubRes.value.data.result?.data ?? []);
        if (activeRes.status === "fulfilled")
          setActiveSubscription(activeRes.value.data.result ?? null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handlePurchase = async (packageId: string) => {
    if (!isAuthenticated) {
      setPurchaseError("Vui lòng đăng nhập để mua gói.");
      return;
    }
    setPurchasing(packageId);
    setPurchaseError(null);
    setPurchaseSuccess(null);
    try {
      const res = await subscriptionService.purchasePackage(packageId);
      const sub = res.data.result;
      setPurchaseSuccess(
        `Mua gói thành công! Gói "${sub.packageName}" có hiệu lực đến ${formatDate(sub.endDate)}.`
      );
      await fetchData();
      setTab("history");
    } catch (e: unknown) {
      const err = e as ErrorWithResponse;
      setPurchaseError(
        err?.response?.data?.message ?? "Không thể mua gói. Vui lòng thử lại."
      );
    } finally {
      setPurchasing(null);
    }
  };

  const cardBg = isDarkMode
    ? "bg-[#0f172a]/80 border-[#4da6ff]/20 text-white"
    : "bg-white border-gray-200 text-gray-900";

  return (
    <div
      className="relative min-h-screen w-full"
      style={{ background: isDarkMode ? "#0f172a" : "#f5f7fa" }}
    >
      <ParallaxBackground isDarkMode={isDarkMode} />

      {/* Hero Banner */}
      <div className="relative z-10 bg-gradient-to-r from-[#4da6ff] via-[#6c63ff] to-[#7c3aed] text-white py-16 px-6 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="max-w-5xl mx-auto text-center relative">
          <span className="inline-block px-4 py-1 rounded-full bg-white/20 text-sm font-medium mb-4 backdrop-blur-sm">
            Nâng cấp trải nghiệm học tập
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
            Chọn gói phù hợp với bạn
          </h1>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto">
            Thanh toán trực tiếp từ ví Elingo. Kích hoạt ngay lập tức, không cần chờ xét duyệt.
          </p>

          {activeSubscription && (
            <div className="mt-6 inline-flex items-center gap-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl px-6 py-3 text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                Gói đang hoạt động:{" "}
                <strong>{activeSubscription.packageName}</strong> — hết hạn{" "}
                {formatDate(activeSubscription.endDate)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-10">
        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {(["packages", "history"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                tab === t
                  ? "bg-gradient-to-r from-[#4da6ff] to-[#7c3aed] text-white shadow-lg"
                  : isDarkMode
                  ? "bg-[#1e293b] text-gray-300 hover:bg-[#2d3a4f]"
                  : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              {t === "packages" ? "Các gói Premium" : "Lịch sử mua gói"}
            </button>
          ))}
        </div>

        {/* Alert Messages */}
        {purchaseError && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3">
            <span className="text-sm font-semibold">Lỗi</span>
            <span>{purchaseError}</span>
            <button
              onClick={() => setPurchaseError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        )}
        {purchaseSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-3">
            <span className="text-sm font-semibold">Thành công</span>
            <span>{purchaseSuccess}</span>
            <button
              onClick={() => setPurchaseSuccess(null)}
              className="ml-auto text-emerald-400 hover:text-emerald-600"
            >
              ✕
            </button>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-[#4da6ff] border-t-transparent rounded-full animate-spin" />
              <p className={isDarkMode ? "text-gray-300" : "text-gray-500"}>
                Đang tải dữ liệu...
              </p>
            </div>
          </div>
        ) : tab === "packages" ? (
          <>
            {packages.length === 0 ? (
              <div
                className={`text-center py-20 rounded-2xl border ${cardBg}`}
              >
                <p
                  className={`text-lg ${
                    isDarkMode ? "text-gray-300" : "text-gray-500"
                  }`}
                >
                  Chưa có gói nào đang hoạt động.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {packages.map((pkg) => (
                  <PackageCard
                    key={pkg.packageId}
                    pkg={pkg}
                    onPurchase={handlePurchase}
                    purchasing={purchasing}
                    isDarkMode={isDarkMode}
                  />
                ))}
              </div>
            )}

            {/* Wallet tip */}
            <div
              className={`mt-8 p-4 rounded-xl border flex items-start gap-3 ${
                isDarkMode
                  ? "bg-[#1e293b] border-[#4da6ff]/20 text-gray-300"
                  : "bg-blue-50 border-blue-200 text-blue-800"
              }`}
            >
              <div className="text-sm">
                <p className="font-semibold mb-1">Thanh toán qua ví Elingo</p>
                <p>
                  Số tiền sẽ được trừ trực tiếp từ ví. Nếu số dư không đủ, hãy{" "}
                  <button
                    onClick={() => navigate("/wallet/recharge")}
                    className="font-semibold underline hover:opacity-80"
                  >
                    nạp thêm tiền
                  </button>{" "}
                  trước khi mua.
                </p>
              </div>
            </div>
          </>
        ) : (
          /* History Tab */
          <div className="space-y-4">
            {!isAuthenticated ? (
              <div className={`text-center py-20 rounded-2xl border ${cardBg}`}>
                <p className={`text-lg mb-4 ${isDarkMode ? "text-gray-300" : "text-gray-500"}`}>
                  Vui lòng đăng nhập để xem lịch sử mua gói.
                </p>
                <button
                  onClick={() => navigate("/login")}
                  className="mt-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#4da6ff] to-[#7c3aed] text-white font-semibold hover:opacity-90 transition"
                >
                  Đăng nhập
                </button>
              </div>
            ) : mySubscriptions.length === 0 ? (
              <div
                className={`text-center py-20 rounded-2xl border ${cardBg}`}
              >
                <p
                  className={`text-lg ${
                    isDarkMode ? "text-gray-300" : "text-gray-500"
                  }`}
                >
                  Bạn chưa mua gói nào.
                </p>
                <button
                  onClick={() => setTab("packages")}
                  className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#4da6ff] to-[#7c3aed] text-white font-semibold hover:opacity-90 transition"
                >
                  Xem các gói ngay
                </button>
              </div>
            ) : (
              mySubscriptions.map((sub) => {
                const st = statusConfig[sub.status] ?? statusConfig.EXPIRED;
                return (
                  <div
                    key={sub.subscriptionId}
                    className={`rounded-2xl border p-5 transition-all ${
                      isDarkMode
                        ? "bg-[#1e293b] border-[#4da6ff]/20"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3
                            className={`font-bold text-lg ${
                              isDarkMode ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {sub.packageName}
                          </h3>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${st.bgColor} ${st.color}`}
                          >
                            {st.label}
                          </span>
                        </div>
                        <div
                          className={`text-sm space-y-1 ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          <p>
                            Từ {formatDate(sub.startDate)} → {formatDate(sub.endDate)}
                          </p>
                          <p>
                            Mua lúc: {new Date(sub.createdAt).toLocaleString("vi-VN")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-extrabold bg-gradient-to-r from-[#4da6ff] to-[#7c3aed] bg-clip-text text-transparent">
                          {formatCurrency(sub.amountPaid)}
                        </p>
                        <p
                          className={`text-xs mt-1 ${
                            isDarkMode ? "text-gray-500" : "text-gray-400"
                          }`}
                        >
                          Đã thanh toán
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      <Footer isDarkMode={isDarkMode} />
    </div>
  );
};

export default SubscriptionPage;
