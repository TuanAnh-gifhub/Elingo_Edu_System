import { useState } from "react";
import { FaArrowDown, FaArrowUp, FaCoins, FaShoppingCart, FaMobileAlt } from "react-icons/fa";

interface Transaction {
    id: string;
    type: "recharge" | "payment" | "refund" | "transfer";
    amount: number;
    description: string;
    date: string;
    status: "completed" | "pending" | "failed";
}

interface WalletHistoryProps {
    showFull?: boolean;
    isDarkMode?: boolean;
}

const WalletHistory = ({ showFull = true, isDarkMode = false }: WalletHistoryProps) => {
    const [transactions] = useState<Transaction[]>([
        // Sample data - in real app, this would come from API
        // {
        //   id: "1",
        //   type: "recharge",
        //   amount: 100000,
        //   description: "Nạp tiền từ thẻ ngân hàng",
        //   date: "2024-01-15T10:30:00",
        //   status: "completed",
        // },
    ]);

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case "recharge":
                return <FaArrowDown className={isDarkMode ? "text-green-400" : "text-green-500"} />;
            case "payment":
                return <FaShoppingCart className={isDarkMode ? "text-red-400" : "text-red-500"} />;
            case "refund":
                return <FaArrowUp className={isDarkMode ? "text-blue-400" : "text-blue-500"} />;
            case "transfer":
                return <FaMobileAlt className={isDarkMode ? "text-purple-400" : "text-purple-500"} />;
            default:
                return <FaCoins className={isDarkMode ? "text-gray-400" : "text-gray-500"} />;
        }
    };

    const getTransactionLabel = (type: string) => {
        switch (type) {
            case "recharge":
                return "Nạp tiền";
            case "payment":
                return "Thanh toán";
            case "refund":
                return "Hoàn tiền";
            case "transfer":
                return "Chuyển khoản";
            default:
                return "Giao dịch";
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat("vi-VN").format(amount);
    };

    if (transactions.length === 0) {
        return (
            <div className={`${isDarkMode ? 'bg-[#2d7fcb] border-[#4da6ff]/30' : 'bg-white border-gray-200'} rounded-xl border shadow-sm p-8`}>
                <div className="text-center py-12">
                    <FaCoins className={`${isDarkMode ? 'text-[#4da6ff]/40' : 'text-gray-300'} text-5xl mx-auto mb-4`} />
                    <p className={isDarkMode ? 'text-gray-300 text-sm' : 'text-gray-500 text-sm'}>
                        {showFull ? "Chưa có giao dịch nào" : "Chưa có giao dịch gần đây"}
                    </p>
                </div>
            </div>
        );
    }

    const displayTransactions = showFull ? transactions : transactions.slice(0, 5);

    return (
        <div className={`${isDarkMode ? 'bg-[#2d7fcb] border-[#4da6ff]/30' : 'bg-white border-gray-200'} rounded-xl border shadow-sm`}>
            <div className={`divide-y ${isDarkMode ? 'divide-[#4da6ff]/20' : 'divide-gray-200'}`}>
                {displayTransactions.map((transaction) => (
                    <div
                        key={transaction.id}
                        className={`p-4 transition-colors cursor-pointer ${isDarkMode ? 'hover:bg-[#4da6ff]/20' : 'hover:bg-gray-50'}`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-[#4da6ff]/20' : 'bg-gray-100'}`}>
                                    {getTransactionIcon(transaction.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {getTransactionLabel(transaction.type)}
                                    </p>
                                    <p className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{transaction.description}</p>
                                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{formatDate(transaction.date)}</p>
                                </div>
                            </div>
                            <div className="text-right ml-4">
                                <p
                                    className={`font-semibold text-sm ${transaction.type === "recharge" || transaction.type === "refund"
                                        ? isDarkMode ? "text-green-400" : "text-green-600"
                                        : isDarkMode ? "text-red-400" : "text-red-600"
                                        }`}
                                >
                                    {transaction.type === "recharge" || transaction.type === "refund" ? "+" : "-"}
                                    {formatAmount(transaction.amount)} đ
                                </p>
                                <span
                                    className={`text-xs px-2 py-1 rounded ${transaction.status === "completed"
                                        ? isDarkMode ? "bg-green-500/20 text-green-300" : "bg-green-100 text-green-700"
                                        : transaction.status === "pending"
                                            ? isDarkMode ? "bg-yellow-500/20 text-yellow-300" : "bg-yellow-100 text-yellow-700"
                                            : isDarkMode ? "bg-red-500/20 text-red-300" : "bg-red-100 text-red-700"
                                        }`}
                                >
                                    {transaction.status === "completed"
                                        ? "Hoàn thành"
                                        : transaction.status === "pending"
                                            ? "Đang xử lý"
                                            : "Thất bại"}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {!showFull && transactions.length > 5 && (
                <div className={`p-4 border-t text-center ${isDarkMode ? 'border-[#4da6ff]/20' : 'border-gray-200'}`}>
                    <button className={`text-sm font-medium hover:underline ${isDarkMode ? 'text-[#4da6ff] hover:text-[#6bb5ff]' : 'text-[#4da6ff]'}`}>
                        Xem thêm giao dịch
                    </button>
                </div>
            )}
        </div>
    );
};

export default WalletHistory;
