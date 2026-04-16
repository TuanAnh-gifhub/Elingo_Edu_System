import { useEffect, useMemo, useState } from "react";
import { reviewService, type ReviewDto } from "../../../services/reviews/reviewService";
import { classRoomService } from "../../../services/classes/classRoomService";

type ErrorWithResponse = { response?: { data?: { message?: string } } };

const AdminReviewManagementPage = () => {
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");
  const [actionLoadingReviewId, setActionLoadingReviewId] = useState<string | null>(null);
  const [teacherNameByClassId, setTeacherNameByClassId] = useState<Record<string, string>>({});

  const loadTeacherNames = async (sourceReviews: ReviewDto[]) => {
    const classIds = Array.from(
      new Set(
        sourceReviews
          .map((review) => review.classId)
          .filter((value): value is string => Boolean(value)),
      ),
    );

    if (classIds.length === 0) {
      setTeacherNameByClassId({});
      return;
    }

    const settled = await Promise.allSettled(
      classIds.map((classId) => classRoomService.getClassById(classId)),
    );

    const nextMap: Record<string, string> = {};
    settled.forEach((result, index) => {
      if (result.status === "fulfilled") {
        nextMap[classIds[index]] = result.value.teacherName || "Chưa cập nhật";
      }
    });

    setTeacherNameByClassId(nextMap);
  };

  const loadReviews = async (targetPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const response = await reviewService.getAdminReviews(targetPage, 20);
      const nextReviews = response.data || [];
      setReviews(nextReviews);
      setPage(response.currentPage || 0);
      setTotalPages(Math.max(1, response.totalPages || 1));
      await loadTeacherNames(nextReviews);
    } catch (e: unknown) {
      const err = e as ErrorWithResponse;
      setError(err?.response?.data?.message || "Không thể tải danh sách đánh giá.");
      setReviews([]);
      setTeacherNameByClassId({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReviews(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredReviews = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    if (!normalizedKeyword) {
      return reviews;
    }

    return reviews.filter((review) => {
      const userName = review.userName.toLowerCase();
      const content = review.comment.toLowerCase();
      const className = (review.className || "").toLowerCase();
      return (
        userName.includes(normalizedKeyword)
        || content.includes(normalizedKeyword)
        || className.includes(normalizedKeyword)
      );
    });
  }, [reviews, keyword]);

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
      await loadReviews(page);
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
      await loadReviews(page);
    } catch (e: unknown) {
      const err = e as ErrorWithResponse;
      setError(err?.response?.data?.message || "Không thể xóa đánh giá.");
    } finally {
      setActionLoadingReviewId(null);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="rounded-2xl border border-blue-100 bg-linear-to-r from-blue-50 via-cyan-50 to-sky-50 px-5 py-4 flex-1 min-w-[260px]">
          <h1 className="text-2xl font-bold text-slate-900">Đánh giá từ khách hàng</h1>
          <p className="text-sm text-slate-600 mt-1">Theo dõi, chỉnh sửa và kiểm duyệt đánh giá lớp học toàn hệ thống.</p>
        </div>
        <button
          type="button"
          onClick={() => void loadReviews(page)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Tải lại
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <input
          type="text"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="Lọc theo người đánh giá hoặc nội dung..."
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        {loading ? <p className="text-sm text-slate-500">Đang tải đánh giá...</p> : null}

        {!loading && filteredReviews.length === 0 ? (
          <p className="text-sm text-slate-500">Không có đánh giá phù hợp.</p>
        ) : null}

        <div className="space-y-3">
          {filteredReviews.map((review) => (
            <article key={review.id} className="rounded-xl border border-slate-200 p-4 shadow-xs hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-slate-900">{review.userName}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700 border border-blue-100">
                      {review.className ? `Lớp: ${review.className}` : "Đánh giá toàn hệ thống"}
                    </span>
                    {review.classId ? (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700 border border-emerald-100">
                        GV: {teacherNameByClassId[review.classId] || "Chưa cập nhật"}
                      </span>
                    ) : null}
                  </div>
                </div>
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

              {editingReviewId !== review.id ? (
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
            onClick={() => void loadReviews(page - 1)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Trước
          </button>
          <span className="text-sm text-slate-600">Trang {page + 1} / {totalPages}</span>
          <button
            type="button"
            disabled={page + 1 >= totalPages || loading}
            onClick={() => void loadReviews(page + 1)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Tiếp
          </button>
        </div>
      </section>
    </div>
  );
};

export default AdminReviewManagementPage;



