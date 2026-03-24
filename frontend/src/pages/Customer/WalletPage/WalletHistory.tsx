import { useEffect, useState } from "react";
import {
  FaArrowDown,
  FaArrowUp,
  FaCoins,
  FaShoppingCart,
  FaMobileAlt,
} from "react-icons/fa";
import {
  walletService,
  type WithdrawRequestItemResponse,
} from "../../../services/wallet/walletService";

type Transaction = {
  id: string;
  type: "recharge" | "payment" | "refund" | "transfer" | "withdraw";
  amount: number;
  description: string;
  channel?: "wallet" | "payos";
  date: string;
  status: "completed" | "pending" | "failed";
};

type WalletHistoryProps = {
  showFull?: boolean;
  isDarkMode?: boolean;
};

const WalletHistory = ({ showFull = true, isDarkMode = false }: WalletHistoryProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const limit = showFull ? 20 : 5;
        const [walletTxPage, withdrawPage] = await Promise.all([
          walletService.getMyTransactions({ page: 1, limit }),
          walletService.getMyWithdrawRequests(1, limit),
        ]);

        const walletMapped: Transaction[] = (walletTxPage.data.result.data ?? []).map(
          (item) => ({
            id: item.transactionId,
            type:
              item.type === "DEPOSIT"
                ? "recharge"
                : item.type === "BOOKING_INCOME" ||
                    item.type === "FREEZE_RELEASE" ||
                    item.type === "WITHDRAW_REJECTED"
                  ? "refund"
                  : item.type === "WITHDRAW" ||
                      item.type === "BOOKING_PAYMENT" ||
                      item.type === "COMMISSION" ||
                      item.type === "PACKAGE_PURCHASE" ||
                      item.type === "FREEZE_HOLD"
                    ? "payment"
                    : item.type === "REFUND"
                      ? "refund"
                      : (item.type as any) === "PAYMENT"
                        ? "payment"
                        : "transfer",
            amount: Number(item.amount ?? 0),
            description: item.description || "Giao dịch ví",
            channel:
              item.type === "BOOKING_PAYMENT" &&
              (item.description || "").toLowerCase().includes("payos")
                ? "payos"
                : "wallet",
            date: item.createdAt,
            status:
              item.status === "COMPLETED"
                ? "completed"
                : item.status === "FAILED"
                  ? "failed"
                  : "pending",
          }),
        );

        const withdrawMapped: Transaction[] = (withdrawPage.data.result.data ?? []).map(
          (item: WithdrawRequestItemResponse) => ({
            id: item.withdrawRequestId,
            type: "withdraw",
            amount: Number(item.amount ?? 0),
            description:
              item.adminNote?.trim() ||
              `Rút tiền về ${item.bankCode} - ${item.bankAccountNumber}`,
            date: item.processedAt || item.createdAt,
            status:
              item.status === "COMPLETED" || item.status === "APPROVED"
                ? "completed"
                : item.status === "REJECTED"
                  ? "failed"
                  : "pending",
          }),
        );

        const merged = [...walletMapped, ...withdrawMapped].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
        setTransactions(merged);
      } catch (error) {
        console.error("Không thể tải lịch sử ví", error);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [showFull]);

  if (loading) {
    return (
      <div
        className={`${
          isDarkMode
            ? "bg-[#2d7fcb] border-[#4da6ff]/30"
            : "bg-white border-gray-200"
        } rounded-xl border shadow-sm p-8`}
      >
        <div className="text-center py-12">
          <p className={isDarkMode ? "text-gray-300 text-sm" : "text-gray-500 text-sm"}>
            Đang tải lịch sử giao dịch...
          </p>
        </div>
      </div>
    );
  }

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
      case "withdraw":
        return <FaArrowUp className={isDarkMode ? "text-orange-400" : "text-orange-500"} />;
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
      case "withdraw":
        return "Rút tiền";
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
      <div
        className={`${
          isDarkMode
            ? "bg-[#2d7fcb] border-[#4da6ff]/30"
            : "bg-white border-gray-200"
        } rounded-xl border shadow-sm p-8`}
      >
        <div className="text-center py-12">
          <FaCoins
            className={`${
              isDarkMode ? "text-[#4da6ff]/40" : "text-gray-300"
            } text-5xl mx-auto mb-4`}
          />
          <p className={isDarkMode ? "text-gray-300 text-sm" : "text-gray-500 text-sm"}>
            {showFull ? "Chưa có giao dịch nào" : "Chưa có giao dịch gần đây"}
          </p>
        </div>
      </div>
    );
  }

  const displayTransactions = showFull ? transactions : transactions.slice(0, 5);

  return (
    <div
      className={`${
        isDarkMode ? "bg-[#2d7fcb] border-[#4da6ff]/30" : "bg-white border-gray-200"
      } rounded-xl border shadow-sm`}
    >
      <div className={`divide-y ${isDarkMode ? "divide-[#4da6ff]/20" : "divide-gray-200"}`}>
        {displayTransactions.map((transaction) => (
          <div
            key={transaction.id}
            className={`p-4 transition-colors cursor-pointer ${
              isDarkMode ? "hover:bg-[#4da6ff]/20" : "hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isDarkMode ? "bg-[#4da6ff]/20" : "bg-gray-100"
                  }`}
                >
                  {getTransactionIcon(transaction.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {getTransactionLabel(transaction.type)}
                  </p>
                  {transaction.type === "payment" && transaction.channel === "payos" && (
                    <p
                      className={`text-[11px] inline-flex px-2 py-[2px] rounded mt-1 ${
                        isDarkMode ? "bg-cyan-500/20 text-cyan-300" : "bg-cyan-100 text-cyan-700"
                      }`}
                    >
                      Qua PayOS
                    </p>
                  )}
                  <p className={`text-xs truncate ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {transaction.description}
                  </p>
                  <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                    {formatDate(transaction.date)}
                  </p>
                </div>
              </div>
              <div className="text-right ml-4">
                <p
                  className={`font-semibold text-sm ${
                    transaction.type === "recharge" || transaction.type === "refund"
                      ? isDarkMode
                        ? "text-green-400"
                        : "text-green-600"
                      : isDarkMode
                        ? "text-red-400"
                        : "text-red-600"
                  }`}
                >
                  {transaction.type === "recharge" || transaction.type === "refund" ? "+" : "-"}
                  {formatAmount(transaction.amount)} đ
                </p>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    transaction.status === "completed"
                      ? isDarkMode
                        ? "bg-green-500/20 text-green-300"
                        : "bg-green-100 text-green-700"
                      : transaction.status === "pending"
                        ? isDarkMode
                          ? "bg-yellow-500/20 text-yellow-300"
                          : "bg-yellow-100 text-yellow-700"
                        : isDarkMode
                          ? "bg-red-500/20 text-red-300"
                          : "bg-red-100 text-red-700"
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
        <div className={`p-4 border-t text-center ${isDarkMode ? "border-[#4da6ff]/20" : "border-gray-200"}`}>
          <button
            className={`text-sm font-medium hover:underline ${
              isDarkMode ? "text-[#4da6ff] hover:text-[#6bb5ff]" : "text-[#4da6ff]"
            }`}
          >
            Xem thêm giao dịch
          </button>
        </div>
      )}
    </div>
  );
};

export default WalletHistory;
