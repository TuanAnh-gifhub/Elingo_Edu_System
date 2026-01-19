import { useState, useEffect } from "react";
import { FaPaperPlane, FaCommentDots, FaEdit, FaTrash, FaStar } from "react-icons/fa";

// ================== Helper ==================
function timeAgo(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Math.max(0, (Date.now() - d.getTime()) / 1000);
  if (diff < 60) return "vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ`;
  return `${Math.floor(diff / 86400)} ngày`;
}

interface AvatarProps {
  src?: string;
  alt?: string;
}

function Avatar({ src, alt }: AvatarProps) {
  return (
    <img
      src={src || "https://i.pravatar.cc/100?img=12"}
      alt={alt || "avatar"}
      className="h-9 w-9 rounded-full object-cover"
    />
  );
}

function SellerBadge() {
  return (
    <span className="ml-2 rounded px-2 py-[2px] text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
      Người cho thuê
    </span>
  );
}

// ================== Comment Item ==================
interface Comment {
  reputationReviewId?: string | number;
  reviewerId?: string | number;
  reviewerName?: string;
  reviewerAvatar?: string;
  comment?: string;
  createdAt?: string | Date;
  isSeller?: boolean;
  replies?: Comment[];
}

interface CommentItemProps {
  comment: Comment;
  currentUser?: {
    id?: string | number;
    name?: string;
  };
  onEditSubmit?: (id: string | number, newText: string) => void;
  onDelete?: (id: string | number) => void;
  isDarkMode?: boolean;
  isReply?: boolean;
}

function CommentItem({
  comment,
  currentUser,
  onEditSubmit,
  onDelete,
  isDarkMode = false,
  isReply = false,
}: CommentItemProps) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.comment || "");

  const canEdit = currentUser?.id === comment.reviewerId;

  const bg = isDarkMode
    ? isReply
      ? "bg-gray-700"
      : "bg-gray-800"
    : isReply
    ? "bg-gray-100"
    : "bg-gray-50";

  return (
    <li className={`flex gap-3 ${isReply ? "ml-8" : ""}`}>
      <Avatar src={comment.reviewerAvatar} />
      <div className="flex-1">
        <div className={`rounded-xl px-3 py-2 ${bg}`}>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`font-semibold ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>
              {comment.reviewerName || "Ẩn danh"}
            </span>
            {comment.isSeller && <SellerBadge />}
            {comment.createdAt && (
              <span className="text-xs text-gray-400">· {timeAgo(comment.createdAt)}</span>
            )}
          </div>

          {editing ? (
            <div className="mt-2">
              <textarea
                className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm text-black"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
              />
              <div className="mt-1 flex gap-2">
                <button
                  onClick={() => {
                    if (comment.reputationReviewId && onEditSubmit) {
                      onEditSubmit(comment.reputationReviewId, editText);
                      setEditing(false);
                    }
                  }}
                  className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm"
                >
                  Lưu
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-3 py-1 bg-gray-300 rounded-md text-sm"
                >
                  Hủy
                </button>
              </div>
            </div>
          ) : (
            <div className={`mt-1 whitespace-pre-line ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
              {comment.comment}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
          {canEdit && (
            <>
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1 hover:text-blue-500"
              >
                <FaEdit size={12} /> Sửa
              </button>
              {comment.reputationReviewId && (
                <button
                  onClick={() => onDelete && onDelete(comment.reputationReviewId!)}
                  className="inline-flex items-center gap-1 hover:text-red-500"
                >
                  <FaTrash size={12} /> Xóa
                </button>
              )}
            </>
          )}
        </div>

        {/* Replies */}
        {Array.isArray(comment.replies) && comment.replies.length > 0 && (
          <ul className="mt-3 space-y-3">
            {comment.replies.map((r) => (
              <CommentItem
                key={r.reputationReviewId}
                comment={r}
                currentUser={currentUser}
                onEditSubmit={onEditSubmit}
                onDelete={onDelete}
                isDarkMode={isDarkMode}
                isReply={true}
              />
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

// ================== Composer ==================
interface ComposerProps {
  onSubmit?: (text: string) => void;
  isDarkMode?: boolean;
}

function Composer({ onSubmit, isDarkMode = false }: ComposerProps) {
  const [value, setValue] = useState("");
  const canSend = value.trim().length > 0;

  return (
    <div
      className={`border-t px-4 py-3 space-y-3 mb-2 transition-colors duration-500 ${
        isDarkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"
      }`}
    >
      <div
        className={`flex items-center gap-2 rounded-full pl-4 ${
          isDarkMode ? "bg-gray-700" : "bg-gray-100"
        }`}
      >
        <input
          type="text"
          className={`w-full bg-transparent py-3 outline-none ${
            isDarkMode ? "text-gray-100 placeholder-gray-400" : ""
          }`}
          placeholder="Bình luận..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button
          aria-label="Gửi bình luận"
          disabled={!canSend}
          onClick={() => {
            if (!canSend) return;
            onSubmit?.(value);
            setValue("");
          }}
          className={`inline-flex h-12 w-auto px-3 gap-2 items-center justify-center rounded-full transition-all duration-200 shadow-sm ${
            canSend
              ? "bg-[#4da6ff] text-white hover:bg-[#3d8cff] hover:scale-105"
              : "bg-gray-400 text-gray-200 cursor-not-allowed"
          }`}
        >
          <FaPaperPlane className="text-lg" />
          <span>Gửi</span>
        </button>
      </div>
    </div>
  );
}

interface LoginPromptProps {
  requireAuth?: (callback: () => void) => void;
  isDarkMode?: boolean;
}

function LoginPrompt({ requireAuth, isDarkMode = false }: LoginPromptProps) {
  return (
    <div
      className={`border-t border-gray-200 px-4 py-6 mb-2 ${
        isDarkMode ? "bg-gray-800" : "bg-gray-50"
      }`}
    >
      <div className="flex flex-col items-center justify-center py-4">
        <FaCommentDots className={`text-3xl mb-3 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} />
        <p className={`font-medium mb-2 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
          Đăng nhập để có thể bình luận
        </p>
        <button
          onClick={() => {
            if (requireAuth) {
              requireAuth(() => {
                // Sau khi đăng nhập thành công, page sẽ reload và hiển thị form bình luận
                window.location.reload();
              });
            }
          }}
          className={`mt-3 px-6 py-2 rounded-full font-semibold transition-all duration-200 shadow-sm ${
            isDarkMode
              ? "bg-[#4da6ff] text-white hover:bg-[#3d8cff]"
              : "bg-[#4da6ff] text-white hover:bg-[#3d8cff]"
          }`}
        >
          Đăng nhập
        </button>
      </div>
    </div>
  );
}

// ================== Rating Display ==================
function RatingDisplay({
  rating = 4.8,
  reviewCount = 96,
  ratingDistribution = { five: 65, four: 30, three: 1, two: 0, one: 0 },
  isDarkMode = false,
}: {
  rating?: number;
  reviewCount?: number;
  ratingDistribution?: {
    five: number;
    four: number;
    three: number;
    two: number;
    one: number;
  };
  isDarkMode?: boolean;
}) {
  const maxCount = Math.max(
    ratingDistribution.five,
    ratingDistribution.four,
    ratingDistribution.three,
    ratingDistribution.two,
    ratingDistribution.one
  );

  const renderStarRating = (value: number) => {
    const fullStars = Math.floor(value);
    const hasHalfStar = value % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: fullStars }).map((_, i) => (
          <FaStar key={`full-${i}`} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
        ))}
        {hasHalfStar && (
          <div className="relative w-5 h-5">
            <FaStar className="w-5 h-5 text-gray-300 absolute" />
            <div className="absolute overflow-hidden w-1/2">
              <FaStar className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            </div>
          </div>
        )}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <FaStar key={`empty-${i}`} className="w-5 h-5 text-gray-300" />
        ))}
      </div>
    );
  };

  const renderRatingBar = (count: number, label: string) => {
    const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
    return (
      <div className="flex items-center gap-3">
        <span className={`text-sm w-12 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
          {label}
        </span>
        <div className={`flex-1 h-2 rounded-full overflow-hidden ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}>
          <div
            className="h-full bg-[#4da6ff] transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className={`text-sm font-medium w-8 text-right ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
          {count}
        </span>
      </div>
    );
  };

  return (
    <div className={`px-4 pt-4 pb-3 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
      <div className="flex items-start gap-8">
        <div className="text-center">
          <div className={`text-5xl font-bold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            {rating.toFixed(1)}
          </div>
          {renderStarRating(rating)}
          <div className={`text-sm mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            {reviewCount} đánh giá
          </div>
        </div>

        <div className="flex-1 space-y-2">
          {renderRatingBar(ratingDistribution.five, "5 sao")}
          {renderRatingBar(ratingDistribution.four, "4 sao")}
          {renderRatingBar(ratingDistribution.three, "3 sao")}
          {renderRatingBar(ratingDistribution.two, "2 sao")}
          {renderRatingBar(ratingDistribution.one, "1 sao")}
        </div>
      </div>
    </div>
  );
}

// ================== Main ==================
interface CommentsSectionProps {
  listingId?: string | number;
  currentUser?: {
    id?: string | number;
    name?: string;
  };
  rating?: number;
  reviewCount?: number;
  ratingDistribution?: {
    five: number;
    four: number;
    three: number;
    two: number;
    one: number;
  };
  isDarkMode?: boolean;
  requireAuth?: (callback: () => void) => void;
}

export default function CommentsSection({
  listingId,
  currentUser,
  rating = 4.8,
  reviewCount = 96,
  ratingDistribution = { five: 65, four: 30, three: 1, two: 0, one: 0 },
  isDarkMode = false,
  requireAuth,
}: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10); // 👈 số bình luận hiển thị ban đầu

  useEffect(() => {
    if (!listingId) return;
    const fetchComments = async () => {
      setLoading(true);
      try {
        // TODO: Implement API call when reviewService is available
        // const res = await reviewService.getReviewsByListing(listingId);
        // if (res?.success && Array.isArray(res.data)) setComments(res.data);
        setComments([]); // Placeholder
      } catch (err) {
        console.error("❌ Lỗi khi tải bình luận:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchComments();
  }, [listingId]);

  const handleAddComment = async (text: string) => {
    try {
      // TODO: Implement API call when reviewService is available
      // const payload = {
      //   reviewerId: currentUser?.id,
      //   revieweeId: sellerInfo?.id,
      //   listingId,
      //   comment: text,
      // };
      // const res = await reviewService.createReviewOrComment(payload);
      // if (res?.success) {
      //   const newCmt = Array.isArray(res.data) ? res.data[0] : res.data;
      //   setComments((prev) => [newCmt, ...prev]);
      // }
      console.log("Add comment:", text);
    } catch (err) {
      console.error("❌ Lỗi khi gửi bình luận:", err);
    }
  };

  const handleEditSubmit = async (id: string | number, newText: string) => {
    try {
      // TODO: Implement API call when reviewService is available
      // const res = await reviewService.updateReviewOrComment(id, {
      //   comment: newText,
      // });
      // if (res?.success) {
      //   setComments((prev) =>
      //     prev.map((c) =>
      //       c.reputationReviewId === id ? { ...c, comment: newText } : c
      //     )
      //   );
      // }
      console.log("Edit comment:", id, newText);
    } catch (err) {
      console.error("❌ Lỗi khi sửa bình luận:", err);
    }
  };

  const handleDelete = async (id: string | number) => {
    try {
      // TODO: Implement API call when reviewService is available
      // const res = await reviewService.deleteReview(id);
      // if (res?.success) {
      //   setComments((prev) => prev.filter((c) => c.reputationReviewId !== id));
      // }
      console.log("Delete comment:", id);
    } catch (err) {
      console.error("❌ Lỗi khi xóa bình luận:", err);
    }
  };

  const visibleComments = comments.slice(0, visibleCount);
  const hasMore = comments.length > visibleCount;

  return (
    <section
      className={`rounded-lg border overflow-hidden transition-colors duration-500 ${
        isDarkMode
          ? "bg-gray-800 border-gray-700 text-gray-100"
          : "bg-white border-gray-200 text-gray-900"
      }`}
    >
      <div className="px-4 pt-4 pb-3 flex justify-between items-center">
        <h3 className="text-lg font-bold">Bình luận</h3>
      </div>

      {/* Rating Section */}
      <RatingDisplay
        rating={rating}
        reviewCount={reviewCount}
        ratingDistribution={ratingDistribution}
        isDarkMode={isDarkMode}
      />

      {currentUser?.id ? (
        <Composer onSubmit={handleAddComment} isDarkMode={isDarkMode} />
      ) : (
        <LoginPrompt requireAuth={requireAuth} isDarkMode={isDarkMode} />
      )}

      {loading ? (
        <div className="px-4 pb-4 text-center text-gray-500">Đang tải...</div>
      ) : comments.length === 0 ? (
        <div className="px-4 pb-4">
          <div
            className={`flex flex-col items-center justify-center rounded-xl py-10 ${
              isDarkMode ? "bg-gray-800" : "bg-gray-50"
            }`}
          >
            <FaCommentDots className="text-3xl text-gray-400" />
            <p className="mt-3 font-medium">Chưa có bình luận nào.</p>
            <p className="text-gray-500 text-sm">Hãy để lại bình luận cho người cho thuê.</p>
          </div>
        </div>
      ) : (
        <div className="px-4 pb-4 space-y-4">
          <ul className="space-y-5">
            {visibleComments.map((c) => (
              <CommentItem
                key={c.reputationReviewId}
                comment={c}
                currentUser={currentUser}
                onEditSubmit={handleEditSubmit}
                onDelete={handleDelete}
                isDarkMode={isDarkMode}
              />
            ))}
          </ul>

          {/* 👇 Nút xem thêm */}
          {hasMore && (
            <div className="flex justify-center">
              <button
                onClick={() => setVisibleCount((v) => v + 10)}
                className="text-[#4da6ff] hover:text-[#3d8cff] text-sm font-medium"
              >
                Xem thêm bình luận...
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
