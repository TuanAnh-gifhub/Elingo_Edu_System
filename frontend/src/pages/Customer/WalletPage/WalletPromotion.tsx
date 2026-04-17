import { useState } from "react";
import { FaGift, FaTag, FaCheckCircle, FaTimes } from "react-icons/fa";

interface Promotion {
    id: string;
    code: string;
    title: string;
    description: string;
    discount: number;
    discountType: "percent" | "amount";
    minAmount?: number;
    maxDiscount?: number;
    expiryDate: string;
    status: "active" | "used" | "expired";
}

interface WalletPromotionProps {
    isDarkMode?: boolean;
}

const WalletPromotion = ({ isDarkMode = false }: WalletPromotionProps) => {
    const [promotions] = useState<Promotion[]>([
        // Sample data - in real app, this would come from API
        // {
        //   id: "1",
        //   code: "WELCOME2024",
        //   title: "Chào mừng năm mới",
        //   description: "Giảm 10% cho đơn hàng đầu tiên",
        //   discount: 10,
        //   discountType: "percent",
        //   minAmount: 50000,
        //   maxDiscount: 50000,
        //   expiryDate: "2024-12-31",
        //   status: "active",
        // },
    ]);

    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [promoCode, setPromoCode] = useState("");

    const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const handleRedeemCode = () => {
        if (!promoCode.trim()) {
            alert("Vui lòng nhập mã khuyến mãi");
            return;
        }
        // Handle redeem logic here
        alert(`Đang kiểm tra mã: ${promoCode}`);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "active":
                return (
                    <span className={`${isDarkMode ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700'} text-xs px-2 py-1 rounded flex items-center gap-1`}>
                        <FaCheckCircle className="text-xs" />
                        Có thể sử dụng
                    </span>
                );
            case "used":
                return (
                    <span className={`${isDarkMode ? 'bg-gray-500/20 text-gray-300' : 'bg-gray-100 text-gray-700'} text-xs px-2 py-1 rounded`}>
                        Đã sử dụng
                    </span>
                );
            case "expired":
                return (
                    <span className={`${isDarkMode ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700'} text-xs px-2 py-1 rounded flex items-center gap-1`}>
                        <FaTimes className="text-xs" />
                        Hết hạn
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <div className="py-8">
            <div className="max-w-7xl mx-auto px-6">
                <div className="mb-6">
                    <h1 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Đổi mã khuyến mãi</h1>
                    <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Nhập mã khuyến mãi để nhận ưu đãi</p>
                </div>

                {/* Redeem Code Section */}
                <div className={`${isDarkMode ? 'bg-[#2d7fcb] border-[#4da6ff]/30' : 'bg-white border-gray-200'} rounded-xl border shadow-sm p-6 mb-6`}>
                    <div className="flex items-center gap-2 mb-4">
                        <FaGift className="text-[#4da6ff] text-xl" />
                        <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Nhập mã khuyến mãi</h2>
                    </div>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                            placeholder="Nhập mã khuyến mãi"
                            className={`flex-1 border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#4da6ff] focus:border-transparent ${isDarkMode ? 'bg-[#4da6ff]/20 border-[#4da6ff]/30 text-white placeholder-white/70' : 'border-gray-300'}`}
                        />
                        <button
                            onClick={handleRedeemCode}
                            className="bg-[#4da6ff] hover:bg-[#3d8fdd] text-white px-6 py-3 rounded-lg font-medium transition-colors"
                        >
                            Đổi mã
                        </button>
                    </div>
                </div>

                {/* Promotions List */}
                <div>
                    <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Mã khuyến mãi của tôi</h2>

                    {promotions.length === 0 ? (
                        <div className={`${isDarkMode ? 'bg-[#2d7fcb] border-[#4da6ff]/30' : 'bg-white border-gray-200'} rounded-xl border shadow-sm p-12 text-center`}>
                            <FaTag className={`${isDarkMode ? 'text-[#4da6ff]/40' : 'text-gray-300'} text-5xl mx-auto mb-4`} />
                            <p className={isDarkMode ? 'text-gray-300 mb-2' : 'text-gray-500 mb-2'}>Bạn chưa có mã khuyến mãi nào</p>
                            <p className={isDarkMode ? 'text-gray-400 text-sm' : 'text-gray-400 text-sm'}>
                                Nhập mã khuyến mãi ở trên để nhận ưu đãi
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {promotions.map((promotion) => (
                                <div
                                    key={promotion.id}
                                    className={`${isDarkMode ? 'bg-[#2d7fcb]' : 'bg-white'} rounded-xl border-2 ${promotion.status === "active"
                                        ? "border-[#4da6ff]"
                                        : isDarkMode ? "border-[#4da6ff]/30" : "border-gray-200"
                                        } shadow-sm p-5 hover:shadow-md transition-shadow`}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h3 className={`font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{promotion.title}</h3>
                                            <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{promotion.description}</p>
                                        </div>
                                        {getStatusBadge(promotion.status)}
                                    </div>

                                    <div className={`${isDarkMode ? 'bg-[#4da6ff]/20' : 'bg-gray-50'} rounded-lg p-3 mb-3`}>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className={`text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Mã khuyến mãi</p>
                                                <p className={`font-mono font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                    {promotion.code}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleCopyCode(promotion.code)}
                                                className={`${isDarkMode ? 'text-[#4da6ff] hover:text-[#6bb5ff]' : 'text-[#4da6ff] hover:text-[#3d8fdd]'} transition-colors`}
                                            >
                                                {copiedCode === promotion.code ? (
                                                    <FaCheckCircle className={`${isDarkMode ? 'text-green-400' : 'text-green-500'} text-xl`} />
                                                ) : (
                                                    <svg
                                                        className="w-5 h-5"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                                        />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center justify-between">
                                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Giảm giá:</span>
                                            <span className="font-semibold text-[#4da6ff]">
                                                {promotion.discountType === "percent"
                                                    ? `${promotion.discount}%`
                                                    : `${promotion.discount.toLocaleString("vi-VN")} VNĐ`}
                                            </span>
                                        </div>
                                        {promotion.minAmount && (
                                            <div className="flex items-center justify-between">
                                                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Đơn tối thiểu:</span>
                                                <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                    {promotion.minAmount.toLocaleString("vi-VN")} VNĐ
                                                </span>
                                            </div>
                                        )}
                                        {promotion.maxDiscount && (
                                            <div className="flex items-center justify-between">
                                                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Giảm tối đa:</span>
                                                <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                    {promotion.maxDiscount.toLocaleString("vi-VN")} VNĐ
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between">
                                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Hết hạn:</span>
                                            <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatDate(promotion.expiryDate)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WalletPromotion;
