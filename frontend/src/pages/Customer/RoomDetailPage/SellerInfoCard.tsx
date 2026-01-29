import { useEffect, useState } from "react";
import { FaCommentDots } from "react-icons/fa6";

interface Seller {
  userId?: string | number;
  userName?: string;
  fullName?: string;
  avatarUrl?: string;
  phone?: string;
  email?: string;
}

interface SellerInfoCardProps {
  seller?: Seller;
  onQuickChat?: (message: string) => void;
  isOwnProduct?: boolean;
  isDarkMode?: boolean;
  listingId?: string | number;
  commentUpdatedAt?: number;
}

export default function SellerInfoCard({
  seller,
  onQuickChat,
  isOwnProduct = false,
  isDarkMode = false,
  listingId,
  commentUpdatedAt,
}: SellerInfoCardProps) {
  const [commentCount, setCommentCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // 🟢 Lấy tổng số bình luận của người cho thuê (theo listing)
  useEffect(() => {
    if (!listingId) return;

    const fetchComments = async () => {
      setLoading(true);
      try {
        // TODO: Implement API call when reviewService is available
        // const res = await reviewService.getReviewsByListing(listingId);
        // if (res?.success && Array.isArray(res.data)) {
        //   const comments = res.data.filter(
        //     (r) => r.comment && r.comment.trim().length > 0
        //   );
        //   setCommentCount(comments.length);
        // }
        setCommentCount(0); // Placeholder
      } catch (err) {
        console.error("❌ Lỗi khi lấy bình luận người cho thuê:", err);
        setCommentCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [listingId, commentUpdatedAt]);

  const sellerName = seller?.fullName || seller?.userName || "Người cho thuê";

  return (
    <section
      className={`rounded-lg p-4 md:p-5 border transition-colors duration-500 ${
        isDarkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"
      }`}
    >
      <div className="flex items-center gap-3">
        <img
          src={seller?.avatarUrl || "https://placehold.co/48x48"}
          alt={sellerName}
          className="h-12 w-12 rounded-full object-cover"
        />

        <div className="min-w-0">
          <div className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            {sellerName}
          </div>

          <div
            className={`text-sm flex flex-wrap items-center gap-x-5 gap-y-1 ${
              isDarkMode ? "text-gray-300" : "text-gray-700"
            }`}
          >
            {loading ? (
              <span className="text-gray-400 text-sm">Đang tải...</span>
            ) : (
              <p className="inline-flex items-center gap-1">
                <FaCommentDots className="text-[#4da6ff]" />
                {commentCount} bình luận
              </p>
            )}
          </div>

          <div
            className={`mt-1 text-xs flex flex-wrap gap-x-5 gap-y-1 ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            <p className="text-[#4da6ff]">• Đang hoạt động</p>
            <p>
              • Phản hồi: <span className="text-[#4da6ff]">70%</span>
            </p>
          </div>
        </div>
      </div>

      {/* Ẩn phần Chat nhanh nếu đây là phòng của chính mình */}
      {!isOwnProduct && (
        <>
          <div className={`mt-3 font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Chat nhanh:
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {["Phòng này còn không ạ?", "Thời hạn thuê từ >"].map((q, i) => (
              <button
                key={i}
                type="button"
                className={`rounded-full px-3 py-1 text-sm border transition-colors duration-300 ${
                  isDarkMode
                    ? "bg-gray-700 text-white border-gray-600 hover:bg-[#4da6ff] hover:border-[#4da6ff]"
                    : "bg-white text-gray-900 border-gray-200 hover:bg-[#4da6ff] hover:text-white hover:border-[#4da6ff]"
                }`}
                onClick={() => onQuickChat?.(q)}
              >
                {q}
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
