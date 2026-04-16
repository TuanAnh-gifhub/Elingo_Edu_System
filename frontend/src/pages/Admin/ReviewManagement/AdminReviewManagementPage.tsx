import { useEffect, useMemo, useState } from "react";
import { reviewService, type ReviewDto } from "../../../services/reviews/reviewService";

type ErrorWithResponse = { response?: { data?: { message?: string } } };

const AdminReviewManagementPage = () => {
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadReviews = async (targetPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const response = await reviewService.getAdminReviews(targetPage, 20);
      setReviews(response.data || []);
      setPage(response.currentPage || 0);
      setTotalPages(Math.max(1, response.totalPages || 1));
    } catch (e: unknown) {
      const err = e as ErrorWithResponse;
      setError(err?.response?.data?.message || "Không thể tải danh sách đánh giá.");
      setReviews([]);
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

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Đánh giá từ khách hàng</h1>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi toàn bộ đánh giá lớp học trên hệ thống.
          </p>
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
            <article key={review.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-slate-900">{review.userName}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {review.className ? `Lớp: ${review.className}` : "Đánh giá toàn hệ thống"}
                  </div>
                </div>
                <div className="text-xs text-slate-500">
                  {new Date(review.createdAt).toLocaleString("vi-VN")}
                </div>
              </div>
              <div className="text-sm text-amber-600 mt-1">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</div>
              <p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap">{review.comment}</p>
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



