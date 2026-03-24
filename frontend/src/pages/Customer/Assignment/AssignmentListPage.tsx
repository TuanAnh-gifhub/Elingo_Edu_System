import { useEffect, useState } from "react";
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

  const loadAssignments = async (
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
  };

  useEffect(() => {
    loadAssignments(1, "");
  }, [user?.role, user?.userId]);

  const now = Date.now();

  const renderDeadlineStatus = (deadline?: string) => {
    if (!deadline) {
      return <span className="text-xs text-gray-500">Khong co deadline</span>;
    }

    const isExpired = new Date(deadline).getTime() < now;
    return (
      <span
        className={`text-xs px-2 py-1 rounded ${
          isExpired ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-700"
        }`}
      >
        {isExpired ? "Da het han" : "Con han"}
      </span>
    );
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Danh sach bai tap</h1>
        {user?.role === "TEACHER" && (
          <Link
            to="/teacher/assignments"
            className="px-3 py-2 rounded bg-blue-600 text-white"
          >
            Quan ly bai tap
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <input
          className="border rounded px-3 py-2 w-full"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Tim theo tieu de"
        />
        <input
          className="border rounded px-3 py-2 w-full"
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          placeholder="Loc theo classId"
        />
        <input
          type="datetime-local"
          className="border rounded px-3 py-2 w-full"
          value={deadlineFrom}
          onChange={(e) => setDeadlineFrom(e.target.value)}
        />
        <input
          type="datetime-local"
          className="border rounded px-3 py-2 w-full"
          value={deadlineTo}
          onChange={(e) => setDeadlineTo(e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => loadAssignments(1, keyword)}
          className="px-4 py-2 rounded bg-blue-600 text-white"
        >
          Tim
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
          className="px-4 py-2 rounded border"
        >
          Xoa loc
        </button>
      </div>

      {loading && <div>Dang tai...</div>}
      {error && <div className="text-red-500">{error}</div>}

      {!loading && !error && (
        <div className="space-y-3">
          {items.length === 0 && <div>Chua co bai tap.</div>}
          {items.map((item) => (
            <div key={item.assignmentId} className="border rounded p-4 bg-white shadow-sm">
              <div className="flex justify-between items-center gap-2">
                <div>
                  <h2 className="font-semibold text-lg">{item.title}</h2>
                  <p className="text-sm text-gray-600">Giao vien: {item.teacherName}</p>
                  <p className="text-sm text-gray-600">Class: {item.classId}</p>
                  {item.deadline && (
                    <p className="text-sm text-orange-600">
                      Deadline: {new Date(item.deadline).toLocaleString("vi-VN")}
                    </p>
                  )}
                  <div className="mt-2">{renderDeadlineStatus(item.deadline)}</div>
                </div>
                {user?.role === "TEACHER" ? (
                  <Link
                    to={`/teacher/assignments/${item.assignmentId}/submissions`}
                    className="px-3 py-2 rounded bg-green-600 text-white"
                  >
                    Xem bai nop
                  </Link>
                ) : (
                  <Link
                    to={`/assignments/${item.assignmentId}`}
                    className="px-3 py-2 rounded bg-green-600 text-white"
                  >
                    Lam bai
                  </Link>
                )}
              </div>
              {item.description && <p className="text-gray-700 mt-2">{item.description}</p>}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          disabled={page <= 1}
          onClick={() => loadAssignments(page - 1, keyword)}
          className="px-3 py-2 rounded border disabled:opacity-50"
        >
          Trang truoc
        </button>
        <span>
          Trang {page}/{totalPages}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => loadAssignments(page + 1, keyword)}
          className="px-3 py-2 rounded border disabled:opacity-50"
        >
          Trang sau
        </button>
      </div>
    </div>
  );
};

export default AssignmentListPage;

