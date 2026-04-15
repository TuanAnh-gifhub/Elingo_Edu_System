import { useCallback, useEffect, useMemo, useState } from "react";
import {
  teacherService,
  type TeacherVerificationStatus,
  type TeacherVerificationResponse,
} from "../../services/teachers/teacherService";

type ViewMode = "PENDING" | "HISTORY";
type FilterStatus = "ALL" | TeacherVerificationStatus;

const STATUS_LABEL: Record<TeacherVerificationStatus, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
};

const STATUS_BADGE_CLASS: Record<TeacherVerificationStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700 border-amber-200",
  APPROVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  REJECTED: "bg-rose-100 text-rose-700 border-rose-200",
};

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("vi-VN");
};

const TeacherVerificationManagementPage = () => {
  const [requests, setRequests] = useState<TeacherVerificationResponse[]>([]);
  const [selected, setSelected] = useState<TeacherVerificationResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string>("");
  const [rejectNote, setRejectNote] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("PENDING");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("ALL");

  const loadRequests = useCallback(async (selectedId?: string) => {
    setLoading(true);
    setErrorMessage("");
    try {
      const result = await teacherService.getAllVerificationRequests();
      setRequests(result);

      const nextSelectedId = selectedId || selected?.id;
      if (nextSelectedId) {
        const updated = result.find((item) => item.id === nextSelectedId) || null;
        setSelected(updated);
      }
    } catch (error: unknown) {
      const message =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message
          ? (
              error as {
                response?: { data?: { message?: string } };
              }
            ).response!.data!.message!
          : "Không thể tải danh sách xác minh giáo viên.";
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }, [selected?.id]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const groupedCount = useMemo(() => {
    return {
      pending: requests.filter((item) => item.status === "PENDING").length,
      approved: requests.filter((item) => item.status === "APPROVED").length,
      rejected: requests.filter((item) => item.status === "REJECTED").length,
    };
  }, [requests]);

  const listByView = useMemo(() => {
    if (viewMode === "PENDING") {
      return requests.filter((item) => item.status === "PENDING");
    }
    return requests.filter(
      (item) => item.status === "APPROVED" || item.status === "REJECTED",
    );
  }, [requests, viewMode]);

  const filteredRequests = useMemo(() => {
    const normalizedKeyword = searchTerm.trim().toLowerCase();

    return listByView.filter((item) => {
      if (statusFilter !== "ALL" && item.status !== statusFilter) {
        return false;
      }

      if (!normalizedKeyword) {
        return true;
      }

      const searchableText = [
        item.fullName,
        item.email,
        item.phone || "",
        item.expertise || "",
        item.role || "",
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedKeyword);
    });
  }, [listByView, searchTerm, statusFilter]);

  useEffect(() => {
    if (!selected) return;
    const existsInCurrentView = filteredRequests.some((item) => item.id === selected.id);
    if (!existsInCurrentView) {
      setSelected(null);
      setRejectNote("");
    }
  }, [filteredRequests, selected]);

  useEffect(() => {
    setStatusFilter("ALL");
  }, [viewMode]);

  const handleSelect = async (id: string) => {
    try {
      const detail = await teacherService.getVerificationRequestById(id);
      setSelected(detail);
      setRejectNote(detail.adminNote || "");
    } catch {
      setSelected(requests.find((item) => item.id === id) || null);
    }
  };

  const handleApprove = async (id: string) => {
    setActionLoadingId(id);
    setErrorMessage("");
    try {
      try {
        await teacherService.reviewVerificationRequest(id, {
          status: "APPROVED",
          adminNote: "",
        });
      } catch (error: unknown) {
        const statusCode =
          typeof error === "object" &&
          error !== null &&
          "response" in error &&
          (error as { response?: { status?: number } }).response?.status
            ? (error as { response?: { status?: number } }).response!.status!
            : 0;

        if (statusCode === 404 || statusCode === 405) {
          await teacherService.approveVerificationRequest(id);
        } else {
          throw error;
        }
      }

      await loadRequests(id);
    } catch (error: unknown) {
      const message =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message
          ? (
              error as {
                response?: { data?: { message?: string } };
              }
            ).response!.data!.message!
          : "Không thể duyệt yêu cầu.";
      setErrorMessage(message);
    } finally {
      setActionLoadingId("");
    }
  };

  const handleReject = async (id: string) => {
    setActionLoadingId(id);
    setErrorMessage("");
    try {
      try {
        await teacherService.reviewVerificationRequest(id, {
          status: "REJECTED",
          adminNote: rejectNote,
        });
      } catch (error: unknown) {
        const statusCode =
          typeof error === "object" &&
          error !== null &&
          "response" in error &&
          (error as { response?: { status?: number } }).response?.status
            ? (error as { response?: { status?: number } }).response!.status!
            : 0;

        if (statusCode === 404 || statusCode === 405) {
          await teacherService.rejectVerificationRequest(id, rejectNote);
        } else {
          throw error;
        }
      }

      await loadRequests(id);
    } catch (error: unknown) {
      const message =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message
          ? (
              error as {
                response?: { data?: { message?: string } };
              }
            ).response!.data!.message!
          : "Không thể từ chối yêu cầu.";
      setErrorMessage(message);
    } finally {
      setActionLoadingId("");
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "inherit" }}>
          Teacher Verification Requests
        </h1>
        <p style={{ color: "inherit" }}>
          Quản lý yêu cầu nâng cấp STUDENT {"->"} TEACHER, lọc nhanh và theo dõi lịch sử duyệt.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          Pending: <span className="font-bold">{groupedCount.pending}</span>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          Approved: <span className="font-bold">{groupedCount.approved}</span>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
          Rejected: <span className="font-bold">{groupedCount.rejected}</span>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700 text-sm">
          {errorMessage}
        </div>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-white p-3 md:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setViewMode("PENDING")}
              className={`px-4 py-2 text-sm font-medium ${
                viewMode === "PENDING"
                  ? "bg-sky-600 text-white"
                  : "bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Cần xử lý ({groupedCount.pending})
            </button>
            <button
              type="button"
              onClick={() => setViewMode("HISTORY")}
              className={`px-4 py-2 text-sm font-medium ${
                viewMode === "HISTORY"
                  ? "bg-sky-600 text-white"
                  : "bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Lịch sử duyệt ({groupedCount.approved + groupedCount.rejected})
            </button>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Tìm theo tên, email, số điện thoại, vai trò..."
              className="w-full sm:w-72 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as FilterStatus)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="ALL">Tất cả trạng thái</option>
              {viewMode === "PENDING" ? (
                <option value="PENDING">Chờ duyệt</option>
              ) : (
                <>
                  <option value="APPROVED">Đã duyệt</option>
                  <option value="REJECTED">Từ chối</option>
                </>
              )}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 font-semibold flex items-center justify-between">
            <span>{viewMode === "PENDING" ? "Danh sách cần xử lý" : "Lịch sử duyệt"}</span>
            <span className="text-xs font-medium text-slate-500">{filteredRequests.length} hồ sơ</span>
          </div>
          {loading ? (
            <p className="p-4 text-sm text-slate-500">Đang tải...</p>
          ) : filteredRequests.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">
              Không có hồ sơ phù hợp với điều kiện tìm kiếm/lọc.
            </p>
          ) : (
            <div className="max-h-[520px] overflow-auto">
              {filteredRequests.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  className={`w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 ${selected?.id === item.id ? "bg-sky-50" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-900">{item.fullName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.email}</p>
                      <p className="text-xs mt-1 text-slate-600">
                        Vai trò: <span className="font-semibold">{item.role || "-"}</span>
                      </p>
                      <p className="text-xs mt-1 text-slate-500">
                        Cập nhật: {formatDateTime(item.updatedAt)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${STATUS_BADGE_CLASS[item.status]}`}
                    >
                      {STATUS_LABEL[item.status]}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          {!selected ? (
            <p className="text-sm text-slate-500">Chọn 1 yêu cầu để xem chi tiết.</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900">{selected.fullName}</h2>
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${STATUS_BADGE_CLASS[selected.status]}`}
                >
                  {STATUS_LABEL[selected.status]}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-600">
                <p>Email: {selected.email}</p>
                <p>Vai trò hiện tại: {selected.role || "-"}</p>
                <p>Số điện thoại: {selected.phone || "-"}</p>
                <p>Ngày tạo: {formatDateTime(selected.createdAt)}</p>
                <p className="md:col-span-2">Cập nhật: {formatDateTime(selected.updatedAt)}</p>
              </div>

              <div className="rounded-lg border border-slate-200 p-3 text-sm text-slate-700">
                <p className="font-medium text-slate-800 mb-1">Giới thiệu</p>
                <p>{selected.bio}</p>
              </div>

              <div className="rounded-lg border border-slate-200 p-3 text-sm text-slate-700">
                <p className="font-medium text-slate-800 mb-1">Kỹ năng</p>
                <p>{selected.expertise}</p>
              </div>

              <div className="rounded-lg border border-slate-200 p-3 text-sm text-slate-700">
                <p className="font-medium text-slate-800 mb-1">Kinh nghiệm</p>
                <p>{selected.experience}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-700">Chứng chỉ</p>
                <ul className="mt-1 space-y-1">
                  {selected.certificateFiles.map((url, index) => (
                    <li key={`${url}-${index}`}>
                      <a href={url} target="_blank" rel="noreferrer" className="text-sm text-blue-700 hover:underline break-all">
                        Chứng chỉ {index + 1}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <textarea
                value={rejectNote}
                onChange={(event) => setRejectNote(event.target.value)}
                placeholder="Ghi chú khi từ chối"
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                <p className="font-medium text-slate-700 mb-1">Thông tin xử lý</p>
                <p>
                  Hồ sơ trong lịch sử vẫn có thể duyệt/từ chối lại nếu admin cần điều chỉnh kết quả.
                </p>
                {selected.adminNote ? (
                  <p className="mt-2">Ghi chú admin hiện tại: {selected.adminNote}</p>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleApprove(selected.id)}
                  disabled={actionLoadingId === selected.id}
                  className="rounded-lg bg-emerald-600 text-white px-3 py-2 text-sm font-semibold disabled:opacity-60"
                >
                  {actionLoadingId === selected.id ? "Đang xử lý..." : "Duyệt"}
                </button>
                <button
                  type="button"
                  onClick={() => handleReject(selected.id)}
                  disabled={actionLoadingId === selected.id}
                  className="rounded-lg bg-rose-600 text-white px-3 py-2 text-sm font-semibold disabled:opacity-60"
                >
                  {actionLoadingId === selected.id ? "Đang xử lý..." : "Từ chối"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherVerificationManagementPage;

