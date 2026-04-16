import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { reviewService, type ReviewDto } from "../../../services/reviews/reviewService";
import { classRoomService } from "../../../services/classes/classRoomService";
import { enrollmentService } from "../../../services/classes/enrollmentService";
import { useAuth } from "../../../context/AuthContext";

type ErrorWithResponse = { response?: { data?: { message?: string } } };

const ClassReviewPage = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");
  const [actionLoadingReviewId, setActionLoadingReviewId] = useState<string | null>(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [canSubmitReview, setCanSubmitReview] = useState(false);
  const [reviewEligibilityMessage, setReviewEligibilityMessage] = useState<string | null>(null);

  const isAdmin = (user?.role || "").toUpperCase().includes("ADMIN");

  const loadData = async (targetPage = page) => {
    if (!classId) return;

    setLoading(true);
    setError(null);
    try {
      const [reviewPage, summary] = await Promise.all([
        reviewService.getClassReviews(classId, targetPage, 10),
        reviewService.getClassReviewSummary(classId),
      ]);
      setReviews(reviewPage.data || []);
      setPage(reviewPage.currentPage || 0);
      setTotalPages(Math.max(1, reviewPage.totalPages || 1));
      setAverageRating(summary.averageRating || 0);
      setTotalReviews(summary.totalReviews || 0);
    } catch (e: unknown) {
      const err = e as ErrorWithResponse;
      setError(err?.response?.data?.message || "Không thể tải đánh giá lớp học.");
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  useEffect(() => {
    if (!classId) {
      setCanSubmitReview(false);
      setReviewEligibilityMessage("Thiếu classId trên URL.");
      return;
    }

    if (!isAuthenticated || !user?.userId) {
      setCanSubmitReview(false);
      setReviewEligibilityMessage("Bạn cần đăng nhập để gửi đánh giá.");
      return;
    }

    const loadEligibility = async () => {
      try {
        setEligibilityLoading(true);
        setReviewEligibilityMessage(null);

        const classInfo = await classRoomService.getClassById(classId);
        if (classInfo.teacherId && classInfo.teacherId === user.userId) {
          setCanSubmitReview(false);
          setReviewEligibilityMessage("Giáo viên không thể tự đánh giá lớp học của mình.");
          return;
        }

        const enrolled = await enrollmentService.checkEnrollment(classId);
        if (!enrolled) {
          setCanSubmitReview(false);
          setReviewEligibilityMessage("Chỉ học sinh đã tham gia lớp học mới được đánh giá.");
          return;
        }

        setCanSubmitReview(true);
        setReviewEligibilityMessage(null);
      } catch {
        setCanSubmitReview(false);
        setReviewEligibilityMessage("Không thể xác minh quyền đánh giá lớp học.");
      } finally {
        setEligibilityLoading(false);
      }
    };

    void loadEligibility();
  }, [classId, isAuthenticated, user?.userId]);

  const handleSubmitReview = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!classId) return;

    if (!canSubmitReview) {
      setError(reviewEligibilityMessage || "Bạn không có quyền đánh giá lớp học này.");
      return;
    }

    if (comment.trim().length < 10) {
      setError("Nội dung đánh giá cần ít nhất 10 ký tự.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await reviewService.createClassReview(classId, {
        rating,
        comment: comment.trim(),
      });
      setComment("");
      setRating(5);
      await loadData(0);
    } catch (e: unknown) {
      const err = e as ErrorWithResponse;
      setError(err?.response?.data?.message || "Không thể gửi đánh giá.");
    } finally {
      setSubmitting(false);
    }
  };

  const canManageReview = (review: ReviewDto) => {
    if (!user?.userId) {
      return false;
    }

    return isAdmin || review.authorId === user.userId;
  };

  const startEditReview = (review: ReviewDto) => {
    setEditingReviewId(review.id);
    setEditRating(review.rating);
    setEditComment(review.comment);
    setError(null);
  };

  const cancelEditReview = () => {
    setEditingReviewId(null);
    setEditRating(5);
    setEditComment("");
  };

  const handleSaveEditReview = async (reviewId: string) => {
    if (editComment.trim().length < 10) {
      setError("Nội dung đánh giá cần ít nhất 10 ký tự.");
      return;
    }

    setActionLoadingReviewId(reviewId);
    setError(null);
    try {
      await reviewService.updateReview(reviewId, {
        rating: editRating,
        comment: editComment.trim(),
      });
      cancelEditReview();
      await loadData(page);
    } catch (e: unknown) {
      const err = e as ErrorWithResponse;
      setError(err?.response?.data?.message || "Không thể cập nhật đánh giá.");
    } finally {
      setActionLoadingReviewId(null);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    const confirmed = window.confirm("Bạn có chắc muốn xóa đánh giá này?");
    if (!confirmed) {
      return;
    }

    setActionLoadingReviewId(reviewId);
    setError(null);
    try {
      await reviewService.deleteReview(reviewId);
      if (editingReviewId === reviewId) {
        cancelEditReview();
      }
      await loadData(page);
    } catch (e: unknown) {
      const err = e as ErrorWithResponse;
      setError(err?.response?.data?.message || "Không thể xóa đánh giá.");
    } finally {
      setActionLoadingReviewId(null);
    }
  };

  if (!classId) {
    return <div className="max-w-5xl mx-auto p-6">Thiếu classId trên URL.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <button
          type="button"
          onClick={() => navigate(`/classes/${classId}`)}
          className="text-sm text-blue-600 hover:underline"
        >
          Quay lại lớp học
        </button>
        <h1 className="text-2xl font-bold text-slate-900 mt-2">Đánh giá lớp học</h1>
        <p className="text-sm text-slate-600 mt-1">
          Điểm trung bình: <span className="font-semibold">{averageRating.toFixed(1)}/5</span> ({totalReviews} đánh giá)
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Gửi đánh giá của bạn</h2>
        {!isAuthenticated ? (
          <p className="text-sm text-slate-500">Bạn cần đăng nhập để gửi đánh giá.</p>
        ) : eligibilityLoading ? (
          <p className="text-sm text-slate-500">Đang kiểm tra quyền đánh giá...</p>
        ) : !canSubmitReview ? (
          <p className="text-sm text-slate-500">{reviewEligibilityMessage || "Bạn không có quyền đánh giá lớp học này."}</p>
        ) : (
          <form onSubmit={handleSubmitReview} className="space-y-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Số sao</label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
              >
                <option value={5}>5 sao</option>
                <option value={4}>4 sao</option>
                <option value={3}>3 sao</option>
                <option value={2}>2 sao</option>
                <option value={1}>1 sao</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Nội dung đánh giá</label>
              <textarea
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Chia sẻ trải nghiệm của bạn về lớp học..."
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
            >
              {submitting ? "Đang gửi..." : "Gửi đánh giá"}
            </button>
          </form>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Danh sách đánh giá</h2>

        {loading ? <p className="text-sm text-slate-500 mt-3">Đang tải đánh giá...</p> : null}

        {!loading && reviews.length === 0 ? (
          <p className="text-sm text-slate-500 mt-3">Chưa có đánh giá nào cho lớp học này.</p>
        ) : null}

        <div className="mt-4 space-y-3">
          {reviews.map((review) => (
            <article key={review.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="font-semibold text-slate-900">{review.userName}</div>
                <div className="text-xs text-slate-500">
                  {new Date(review.createdAt).toLocaleString("vi-VN")}
                </div>
              </div>

              {editingReviewId === review.id ? (
                <div className="mt-3 space-y-3">
                  <select
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={editRating}
                    onChange={(event) => setEditRating(Number(event.target.value))}
                  >
                    <option value={5}>5 sao</option>
                    <option value={4}>4 sao</option>
                    <option value={3}>3 sao</option>
                    <option value={2}>2 sao</option>
                    <option value={1}>1 sao</option>
                  </select>
                  <textarea
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    rows={4}
                    value={editComment}
                    onChange={(event) => setEditComment(event.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void handleSaveEditReview(review.id)}
                      disabled={actionLoadingReviewId === review.id}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                    >
                      {actionLoadingReviewId === review.id ? "Đang lưu..." : "Lưu"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditReview}
                      disabled={actionLoadingReviewId === review.id}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-sm text-amber-600 mt-1">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</div>
                  <p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap">{review.comment}</p>
                </>
              )}

              {canManageReview(review) && editingReviewId !== review.id ? (
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startEditReview(review)}
                    className="rounded-lg border border-blue-300 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDeleteReview(review.id)}
                    disabled={actionLoadingReviewId === review.id}
                    className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                  >
                    {actionLoadingReviewId === review.id ? "Đang xóa..." : "Xóa"}
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={page <= 0 || loading}
            onClick={() => void loadData(page - 1)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Trước
          </button>
          <span className="text-sm text-slate-600">Trang {page + 1} / {totalPages}</span>
          <button
            type="button"
            disabled={page + 1 >= totalPages || loading}
            onClick={() => void loadData(page + 1)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Tiếp
          </button>
        </div>
      </section>
    </div>
  );
};

export default ClassReviewPage;

