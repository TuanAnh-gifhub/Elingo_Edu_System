import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import WalletCard from "./WalletCard";
import WalletHistory from "./WalletHistory";
import WalletPromotion from "./WalletPromotion";
import ParallaxBackground from "../LandingPage/ParallaxBackground";
import Footer from "../../../components/Footer/Footer";
// Import các tính năng khác khi cần
// import WalletRecharge from "./WalletRecharge";
// import WalletWithdraw from "./WalletWithdraw";
import {
    FaCoins,
    FaMobileAlt,
    FaGift,
    FaHistory,
    FaHeadphonesAlt
} from "react-icons/fa";

type WalletFeature = "overview" | "history" | "promotion" | "recharge" | "withdraw" | "help";

const WalletPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [totalBalance] = useState(0);
    const [mainAccountBalance] = useState(0);
    const [userName] = useState("Tran Le Tuan Anh");
    const [userInfo] = useState("K17 HCM");
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const stored = localStorage.getItem('landing_dark_mode');
        return stored === 'true';
    });

    useEffect(() => {
        const handleDarkModeChange = (event: Event) => {
            const customEvent = event as CustomEvent<{ isDarkMode: boolean }>;
            setIsDarkMode(customEvent.detail.isDarkMode);
        };

        window.addEventListener('darkModeChanged', handleDarkModeChange);
        return () => window.removeEventListener('darkModeChanged', handleDarkModeChange);
    }, []);

    // Xác định tính năng hiện tại dựa trên URL
    const getCurrentFeature = (): WalletFeature => {
        const path = location.pathname;
        if (path.includes("/promotion")) return "promotion";
        if (path.includes("/history")) return "history";
        if (path.includes("/recharge")) return "recharge";
        if (path.includes("/withdraw")) return "withdraw";
        if (path.includes("/help")) return "help";
        return "overview";
    };

    const activeFeature = getCurrentFeature();

    const categories = [
        {
            icon: FaCoins,
            label: "Nạp Đồng Tốt",
            color: "text-yellow-500",
            bgColor: "bg-yellow-50",
            feature: "recharge" as WalletFeature,
            onClick: () => {
                navigate("/wallet/recharge");
            },
        },
        {
            icon: FaMobileAlt,
            label: "Nạp ĐT giá trị linh hoạt",
            color: "text-blue-500",
            bgColor: "bg-blue-50",
            feature: "recharge" as WalletFeature,
            onClick: () => {
                navigate("/wallet/recharge-phone");
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
    ];

    const handleRecharge = () => {
        navigate("/wallet/recharge");
    };

    const handleViewDetails = () => {
        navigate("/wallet/details");
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
                    <div className={`${isDarkMode ? 'bg-[#2d7fcb] border-[#4da6ff]/30' : 'bg-white border-gray-200'} rounded-xl border shadow-sm p-8 text-center`}>
                        <FaCoins className={`${isDarkMode ? 'text-yellow-400' : 'text-yellow-500'} text-5xl mx-auto mb-4`} />
                        <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Nạp Đồng Tốt</h3>
                        <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Tính năng đang được phát triển</p>
                    </div>
                );
            case "withdraw":
                return (
                    <div className={`${isDarkMode ? 'bg-[#2d7fcb] border-[#4da6ff]/30' : 'bg-white border-gray-200'} rounded-xl border shadow-sm p-8 text-center`}>
                        <FaCoins className={`${isDarkMode ? 'text-[#6bb5ff]' : 'text-[#4da6ff]'} text-5xl mx-auto mb-4`} />
                        <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Rút tiền</h3>
                        <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Tính năng đang được phát triển</p>
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
                                    mainAccountBalance={mainAccountBalance}
                                    onRecharge={handleRecharge}
                                    onViewDetails={handleViewDetails}
                                    isDarkMode={isDarkMode}
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
                            Xin chào, {userName} ({userInfo})
                        </h2>
                    </div>
                    <div>
                        <p className="text-sm text-gray-300 mb-1">Tài khoản định danh</p>
                        <input
                            type="text"
                            placeholder="Nhập số tài khoản"
                            className="bg-white/20 backdrop-blur-sm border border-white/30 rounded px-3 py-2 text-sm text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 w-48"
                        />
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
