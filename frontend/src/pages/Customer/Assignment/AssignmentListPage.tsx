import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import assignmentService, {
  type Assignment,
} from "../../../services/assignments/assignmentService";

const AssignmentListPage = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Assignment[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [classId, setClassId] = useState("");
  const [deadlineFrom, setDeadlineFrom] = useState("");
  const [deadlineTo, setDeadlineTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAssignments = useCallback(async (
    targetPage = 1,
    search = "",
    filters?: { classId?: string; deadlineFrom?: string; deadlineTo?: string },
  ) => {
    setLoading(true);
    setError(null);
    try {
      const classIdValue = filters?.classId ?? classId;
      const deadlineFromValue = filters?.deadlineFrom ?? deadlineFrom;
      const deadlineToValue = filters?.deadlineTo ?? deadlineTo;
      const data = await assignmentService.getAssignments({
        page: targetPage,
        size: 10,
        keyword: search || undefined,
        classId: classIdValue || undefined,
        teacherId: user?.role === "TEACHER" ? user.userId : undefined,
        deadlineFrom: deadlineFromValue
          ? new Date(deadlineFromValue).toISOString()
          : undefined,
        deadlineTo: deadlineToValue ? new Date(deadlineToValue).toISOString() : undefined,
        active: true,
      });
      setItems(data.data || []);
      setPage(data.currentPage || targetPage);
      setTotalPages(Math.max(data.totalPages || 1, 1));
    } catch (e) {
      console.error(e);
      setError("Khong the tai danh sach bai tap");
    } finally {
      setLoading(false);
    }
  }, [classId, deadlineFrom, deadlineTo, user?.role, user?.userId]);

  useEffect(() => {
    loadAssignments(1, "");
  }, [loadAssignments]);

  const now = Date.now();

  const renderDeadlineStatus = (deadline?: string) => {
    if (!deadline) {
      return <span className="text-xs text-gray-500">Khong co deadline</span>;
    }

    const isExpired = new Date(deadline).getTime() < now;
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
          isExpired ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
        }`}
      >
        {isExpired ? "Da het han" : "Con han"}
      </span>
    );
  };

  const formatDateTime = (value?: string) => {
    if (!value) return "Khong co han nop";
    return new Date(value).toLocaleString("vi-VN");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-lg">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold md:text-3xl">Danh sach bai tap</h1>
              <p className="mt-1 text-sm text-blue-100 md:text-base">
                Theo doi bai tap theo lop, deadline va trang thai de hoc tap hieu qua hon.
              </p>
            </div>
            <div className="rounded-xl bg-white/15 px-4 py-3 text-sm backdrop-blur">
              <div className="font-semibold">Tong bai tap hien thi: {items.length}</div>
              <div className="text-blue-100">Trang {page}/{totalPages}</div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-800">Bo loc bai tap</h2>
            {user?.role === "TEACHER" && (
              <Link
                to="/teacher/assignments"
                className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                Quan ly bai tap
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tim theo tieu de"
            />
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              placeholder="Loc theo classId"
            />
            <input
              type="datetime-local"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              value={deadlineFrom}
              onChange={(e) => setDeadlineFrom(e.target.value)}
            />
            <input
              type="datetime-local"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              value={deadlineTo}
              onChange={(e) => setDeadlineTo(e.target.value)}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => loadAssignments(1, keyword)}
              className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Tim kiem
            </button>
            <button
              onClick={() => {
                setKeyword("");
                setClassId("");
                setDeadlineFrom("");
                setDeadlineTo("");
                loadAssignments(1, "", {
                  classId: "",
                  deadlineFrom: "",
                  deadlineTo: "",
                });
              }}
              className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Dat lai bo loc
            </button>
          </div>
        </section>

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
            Dang tai danh sach bai tap...
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && (
          <section className="space-y-4">
            {items.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
                Chua co bai tap nao phu hop voi bo loc hien tai.
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {items.map((item) => (
                <article
                  key={item.assignmentId}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h2 className="text-lg font-semibold text-slate-900">{item.title}</h2>
                      <p className="text-sm text-slate-600">Giao vien: {item.teacherName}</p>
                      <p className="text-sm text-slate-600">Class: {item.classId}</p>
                    </div>
                    {renderDeadlineStatus(item.deadline)}
                  </div>

                  {item.description && (
                    <p className="mt-3 line-clamp-3 text-sm text-slate-700">{item.description}</p>
                  )}

                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <div className="text-xs text-slate-500">Deadline: {formatDateTime(item.deadline)}</div>
                    {user?.role === "TEACHER" ? (
                      <Link
                        to={`/teacher/assignments/${item.assignmentId}/submissions`}
                        className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
                      >
                        Xem bai nop
                      </Link>
                    ) : (
                      <Link
                        to={`/assignments/${item.assignmentId}`}
                        className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                      >
                        Lam bai ngay
                      </Link>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <button
              disabled={page <= 1}
              onClick={() => loadAssignments(page - 1, keyword)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Trang truoc
            </button>
            <span className="text-sm font-medium text-slate-700">
              Trang {page}/{totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => loadAssignments(page + 1, keyword)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Trang sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentListPage;

