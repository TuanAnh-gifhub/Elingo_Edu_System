import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  classRoomService,
  type ClassRoomDto,
} from "../../../services/classes/classRoomService";
import {
  reviewService,
  type ReviewDto,
  type ReviewSummaryDto,
} from "../../../services/reviews/reviewService";
import RichTextContent from "../../../components/common/RichTextContent";
import { enrollmentService } from "../../../services/classes/enrollmentService";
import { walletService } from "../../../services/wallet/walletService";
import { useAuth } from "../../../context/AuthContext";

const isStudentRole = (role?: string) => role?.toUpperCase().includes("STUDENT");

const formatClassDateTime = (dateValue?: string): string => {
  if (!dateValue) {
    return "Chưa cập nhật";
  }

  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return "Chưa cập nhật";
  }

  return parsedDate.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const ClassDetailPage = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [clazz, setClazz] = useState<ClassRoomDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [checkingEnrollment, setCheckingEnrollment] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [showConfirmEnroll, setShowConfirmEnroll] = useState(false);
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummaryDto | null>(
    null,
  );
  const [recentReviews, setRecentReviews] = useState<ReviewDto[]>([]);

  const isStudent = useMemo(() => isStudentRole(user?.role), [user?.role]);
  const hasClassEnded = useMemo(() => {
    if (!clazz?.endDate) {
      return false;
    }

    const endDate = new Date(clazz.endDate);
    if (Number.isNaN(endDate.getTime())) {
      return false;
    }

    return Date.now() > endDate.getTime();
  }, [clazz?.endDate]);

  useEffect(() => {
    if (!classId) return;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await classRoomService.getClassById(classId);
        setClazz(data);
      } catch (e) {
        console.error("Failed to load class detail", e);
        setError("Không thể tải thông tin lớp học");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [classId]);

  useEffect(() => {
    if (!classId || !isStudent || !user?.userId) {
      setIsEnrolled(false);
      return;
    }

    const checkEnrollment = async () => {
      try {
        setCheckingEnrollment(true);
        const enrolled = await enrollmentService.checkEnrollment(classId);
        setIsEnrolled(enrolled);
      } catch {
        setIsEnrolled(false);
      } finally {
        setCheckingEnrollment(false);
      }
    };

    checkEnrollment();
  }, [classId, isStudent, user?.userId]);

useEffect(() => {
    if (hasClassEnded) {
      setShowConfirmEnroll(false);
    }
  }, [hasClassEnded]);

  // Logic tải đánh giá lớp học (Từ nhánh nhanhmoi)
  useEffect(() => {
    if (!classId) {
      return;
    }

    const loadReviews = async () => {
      setReviewLoading(true);
      setReviewError(null);

      try {
        const [summaryRes, reviewPageRes] = await Promise.all([
          reviewService.getClassReviewSummary(classId),
          reviewService.getClassReviews(classId, 0, 5),
        ]);

        setReviewSummary(summaryRes);
        setRecentReviews(reviewPageRes.data || []);
      } catch (error) {
        console.error("Failed to load class reviews", error);
        setReviewError("Không thể tải đánh giá khóa học.");
        setReviewSummary(null);
        setRecentReviews([]);
      } finally {
        setReviewLoading(false);
      }
    };

    void loadReviews();
  }, [classId]);

  const handleConfirmEnroll = async () => {
    if (!classId || !clazz) {
      return;
    }

    if (hasClassEnded) {
      setShowConfirmEnroll(false);
      toast.error("Lớp học đã kết thúc, không thể nhập học.");
      return;
    }

    try {
      setEnrolling(true);
      const walletRes = await walletService.getMyWallet();
      const currentBalance = Number(walletRes.data.result.balance || 0);
      const price = Number(clazz.price || 0);

      if (currentBalance < price) {
        setShowConfirmEnroll(false);
        setShowInsufficientModal(true);
        return;
      }

      await enrollmentService.createEnrollment({ classId });
      setIsEnrolled(true);
      setShowConfirmEnroll(false);
      toast.success("Nhập học thành công.");
      navigate(`/classes/${classId}/learning`);
    } catch (enrollError) {
      const message =
        enrollError instanceof Error ? enrollError.message : "Không thể nhập học.";
      toast.error(message);
    } finally {
      setEnrolling(false);
    }
  };

  if (!classId) return <div className="p-6">Thiếu classId trên URL</div>;
  if (loading) return <div className="p-6">Đang tải thông tin lớp học…</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!clazz) return <div className="p-6">Không tìm thấy lớp học</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {clazz.poster && (
        <div className="w-full h-72 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
          <img
            src={clazz.poster}
            alt={clazz.className}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{clazz.className}</h1>
            <RichTextContent
              content={clazz.description}
              emptyFallback=""
              className="text-slate-700 wrap-break-word [&_a]:text-blue-600 [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-4 [&_blockquote]:border-blue-200 [&_blockquote]:pl-3"
            />
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="inline-flex rounded-full bg-blue-100 text-blue-700 px-3 py-1">
                Lịch học: {clazz.schedule || "Chưa cập nhật"}
              </span>
              <span className="inline-flex rounded-full bg-violet-100 text-violet-700 px-3 py-1">
                Bắt đầu: {formatClassDateTime(clazz.startDate)}
              </span>
              <span className="inline-flex rounded-full bg-rose-100 text-rose-700 px-3 py-1">
                Kết thúc: {formatClassDateTime(clazz.endDate)}
              </span>
              <span className="inline-flex rounded-full bg-emerald-100 text-emerald-700 px-3 py-1">
                Sĩ số: {clazz.currentStudents ?? 0}/{clazz.maxStudents ?? "-"}
              </span>
              {hasClassEnded ? (
                <span className="inline-flex rounded-full bg-slate-200 text-slate-700 px-3 py-1">
                  Lớp đã kết thúc
                </span>
              ) : null}
            </div>
          </div>

          <div className="w-full md:w-72 shrink-0 rounded-2xl border border-cyan-100 bg-cyan-50/50 p-4 space-y-2">
            <p className="text-sm text-slate-500">Giá vào lớp</p>
            <p className="text-2xl font-bold text-cyan-700">
              {Number(clazz.price || 0).toLocaleString("vi-VN")} đ
            </p>
            {isStudent ? (
              isEnrolled ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/classes/${clazz.classId}/learning`)}
                    className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-4 py-2 text-sm font-semibold"
                  >
                    Vào lớp học của tôi
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/classes/${clazz.classId}/reviews`)}
                    className="w-full rounded-xl border border-cyan-300 bg-white px-4 py-2 text-sm font-semibold text-cyan-700"
                  >
                    Xem & viết đánh giá lớp
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (hasClassEnded) {
                      toast.error("Lớp học đã kết thúc, không thể nhập học.");
                      return;
                    }

                    setShowConfirmEnroll(true);
                  }}
                  disabled={checkingEnrollment || enrolling || hasClassEnded}
                  className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
                >
                  {hasClassEnded
                    ? "Lớp đã kết thúc"
                    : enrolling
                      ? "Đang xử lý..."
                      : `Vào lớp với giá ${Number(clazz.price || 0).toLocaleString("vi-VN")} đ`}
                </button>
              )
            ) : (
              <p className="text-xs text-slate-500">Đăng nhập tài khoản học sinh để nhập học lớp này.</p>
            )}
            {isStudent && !isEnrolled && hasClassEnded ? (
              <p className="text-xs text-rose-600">Lớp đã kết thúc nên không thể thanh toán để nhập học.</p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Thông tin giáo viên</h2>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-700">
          <p>
            <span className="font-medium">Tên:</span> {clazz.teacherName || "Đang cập nhật"}
          </p>
          <p>
            <span className="font-medium">Email:</span> {clazz.teacherEmail || "Đang cập nhật"}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-lg font-semibold text-slate-900">Đánh giá khóa học</h2>
          <button
            type="button"
            onClick={() => navigate(`/classes/${clazz.classId}/reviews`)}
            className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-sm font-medium text-blue-700"
          >
            Xem tất cả đánh giá
          </button>
        </div>

        {reviewSummary ? (
          <div className="text-sm text-slate-600">
            Điểm trung bình: <span className="font-semibold">{reviewSummary.averageRating.toFixed(1)}/5</span>
            {" "}({reviewSummary.totalReviews} đánh giá)
          </div>
        ) : null}

        {reviewLoading ? <p className="text-sm text-slate-500">Đang tải đánh giá...</p> : null}
        {reviewError ? <p className="text-sm text-rose-600">{reviewError}</p> : null}

        {!reviewLoading && !reviewError && recentReviews.length === 0 ? (
          <p className="text-sm text-slate-500">Chưa có đánh giá nào cho khóa học này.</p>
        ) : null}

        {!reviewLoading && !reviewError && recentReviews.length > 0 ? (
          <div className="space-y-3">
            {recentReviews.map((review) => (
              <article key={review.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="font-semibold text-slate-900">{review.userName}</div>
                  <div className="text-xs text-slate-500">
                    {new Date(review.createdAt).toLocaleString("vi-VN")}
                  </div>
                </div>
                <div className="text-sm text-amber-600 mt-1">
                  {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                </div>
                <p className="text-sm text-slate-700 mt-2 whitespace-pre-line">{review.comment}</p>
              </article>
            ))}
          </div>
        ) : null}
      </section>

      {showConfirmEnroll ? (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Xác nhận nhập học</h3>
            <p className="text-sm text-slate-600">
              Bạn có chắc chắn muốn bỏ ra {Number(clazz.price || 0).toLocaleString("vi-VN")} đ để vào lớp này không?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmEnroll(false)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
              >
                Không
              </button>
              <button
                type="button"
                onClick={handleConfirmEnroll}
                disabled={enrolling}
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {enrolling ? "Đang xử lý..." : "Có"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showInsufficientModal ? (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl space-y-4">
            <h3 className="text-lg font-semibold text-rose-700">Ví không đủ tiền</h3>
            <p className="text-sm text-slate-600">
              Bạn không có đủ số dư để vào lớp này. Vui lòng nạp thêm tiền vào ví.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowInsufficientModal(false)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => navigate("/wallet")}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white"
              >
                Đi đến ví
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ClassDetailPage;
