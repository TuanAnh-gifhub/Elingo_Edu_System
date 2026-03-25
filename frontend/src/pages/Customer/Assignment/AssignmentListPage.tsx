import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import assignmentService, {
  type Assignment,
  type Submission,
  resolveAssignmentErrorMessage,
} from "../../../services/assignments/assignmentService";
import { classRoomService, type ClassRoomDto } from "../../../services/classes/classRoomService";
import AssignmentCard from "../../../components/Assignment/AssignmentCard";
import { StatusBadge } from "../../../components/Assignment/StatusBadge";

const AssignmentListPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isStudent = user?.role?.toUpperCase() === "STUDENT";
  const [items, setItems] = useState<Assignment[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [classId, setClassId] = useState("");
  const [deadlineFrom, setDeadlineFrom] = useState("");
  const [deadlineTo, setDeadlineTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [classGroups, setClassGroups] = useState<ClassRoomDto[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [joinedClassIds, setJoinedClassIds] = useState<string[]>([]);
  const [joiningClassId, setJoiningClassId] = useState<string | null>(null);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [joinModalClass, setJoinModalClass] = useState<ClassRoomDto | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);
  const [startModalAssignment, setStartModalAssignment] = useState<Assignment | null>(null);
  const [startPasswordInput, setStartPasswordInput] = useState("");
  const [startError, setStartError] = useState<string | null>(null);
  const [startingAssignmentId, setStartingAssignmentId] = useState<string | null>(null);
  const [latestSubmissionMap, setLatestSubmissionMap] = useState<Record<string, Submission>>({});

  const loadAssignments = useCallback(async (
    targetPage = 1,
    search = "",
    filters?: { classId?: string; deadlineFrom?: string; deadlineTo?: string },
  ) => {
    const classIdValue = isStudent
      ? (filters?.classId ?? selectedGroupId)
      : (filters?.classId ?? classId);

    if (isStudent && !classIdValue) {
      setItems([]);
      setPage(1);
      setTotalPages(1);
      return;
    }

    setLoading(true);
    setError(null);
    try {
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
  }, [classId, deadlineFrom, deadlineTo, isStudent, selectedGroupId, user?.role, user?.userId]);

  const loadClassGroups = useCallback(async () => {
    if (!isStudent) return;
    try {
      const data = await classRoomService.getClasses(1, 200, { active: true });
      setClassGroups(data.data || []);
    } catch (e) {
      console.error(e);
    }
  }, [isStudent]);

  const loadJoinedClassIds = useCallback(async () => {
    if (!isStudent) return;
    try {
      const ids = await classRoomService.getJoinedClassIds();
      setJoinedClassIds(ids || []);
    } catch (e) {
      console.error(e);
    }
  }, [isStudent]);

  useEffect(() => {
    loadAssignments(1, "");
  }, [loadAssignments]);

  useEffect(() => {
    void loadClassGroups();
    void loadJoinedClassIds();
  }, [loadClassGroups, loadJoinedClassIds]);

  useEffect(() => {
    if (!isStudent || !selectedGroupId) return;
    if (!joinedClassIds.includes(selectedGroupId)) {
      setSelectedGroupId("");
      setItems([]);
      setPage(1);
      setTotalPages(1);
    }
  }, [isStudent, joinedClassIds, selectedGroupId]);

  useEffect(() => {
    if (!isStudent || items.length === 0) {
      setLatestSubmissionMap({});
      return;
    }

    const loadLatestSubmissions = async () => {
      try {
        const assignmentIds = items.map((item) => item.assignmentId);
        const result = await assignmentService.getLatestMySubmissionsByAssignments(assignmentIds);
        const nextMap: Record<string, Submission> = {};
        Object.entries(result).forEach(([key, value]) => {
          if (value) {
            nextMap[key] = value;
          }
        });
        setLatestSubmissionMap(nextMap);
      } catch (e) {
        console.error(e);
      }
    };

    void loadLatestSubmissions();
  }, [isStudent, items]);

  const joinedClassIdSet = useMemo(() => new Set(joinedClassIds), [joinedClassIds]);

  const classNameMap = useMemo(
    () =>
      classGroups.reduce<Record<string, string>>((acc, item) => {
        acc[item.classId] = item.className;
        return acc;
      }, {}),
    [classGroups],
  );

  const selectedGroupName = selectedGroupId
    ? classNameMap[selectedGroupId] || selectedGroupId
    : "";

  const handleJoinClass = async (classItem: ClassRoomDto, joinCode?: string) => {
    setJoiningClassId(classItem.classId);
    setJoinError(null);
    setJoinSuccess(null);
    try {
      await classRoomService.joinClass(classItem.classId, joinCode);
      await loadJoinedClassIds();
      setSelectedGroupId(classItem.classId);
      await loadAssignments(1, keyword, { classId: classItem.classId });
      setJoinModalClass(null);
      setJoinCodeInput("");
      setJoinSuccess(`Tham gia nhom "${classItem.className}" thanh cong.`);
    } catch (e) {
      console.error(e);
      setJoinError(resolveAssignmentErrorMessage(e, "Khong the tham gia nhom bai tap."));
    } finally {
      setJoiningClassId(null);
    }
  };

  const handleStartAssignment = async (assignment: Assignment, accessPassword?: string) => {
    setStartingAssignmentId(assignment.assignmentId);
    setStartError(null);
    try {
      await assignmentService.startAssignment(assignment.assignmentId, accessPassword);
      setStartModalAssignment(null);
      setStartPasswordInput("");
      navigate(`/assignments/${assignment.assignmentId}`, {
        state: {
          accessPassword: accessPassword || "",
          className: classNameMap[assignment.classId] || assignment.classId,
        },
      });
    } catch (e) {
      console.error(e);
      setStartError(resolveAssignmentErrorMessage(e, "Khong the bat dau bai tap."));
    } finally {
      setStartingAssignmentId(null);
    }
  };

  const openGroupAssignments = (groupId: string) => {
    setSelectedGroupId(groupId);
    setClassId(groupId);
    void loadAssignments(1, keyword, { classId: groupId });
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 p-6 text-white shadow-lg">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold md:text-3xl">Danh sach bai tap</h1>
              <p className="mt-1 text-sm text-blue-100 md:text-base">
                Theo doi bai tap theo nhom, deadline va trang thai nop bai trong mot giao dien gon gang.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 rounded-2xl bg-white/15 p-4 text-sm backdrop-blur sm:grid-cols-3">
              <div className="font-semibold">Tong bai tap hien thi: {items.length}</div>
              <div className="text-blue-100">Trang {page}/{totalPages}</div>
              {isStudent && (
                <div className="text-blue-100">Nhom da tham gia: {joinedClassIds.length}</div>
              )}
            </div>
          </div>
        </section>

        {joinSuccess && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {joinSuccess}
          </div>
        )}

        {isStudent && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-label="Danh sach nhom bai tap">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Nhom bai tap</h2>
              <span className="text-xs text-slate-500">Tham gia 1 lan de mo bai tap trong nhom</span>
            </div>

            <div className="mb-4 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-xs text-indigo-700">
              Ma nhom chi dung khi <b>tham gia nhom</b>. Mat khau bai tap (neu co) se duoc nhap rieng khi hoc vien bam lam bai.
            </div>

            {classGroups.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                Chua co nhom bai tap.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {classGroups.map((group) => {
                  const joined = joinedClassIdSet.has(group.classId);
                  return (
                    <article
                      key={group.classId}
                      role={joined ? "button" : undefined}
                      tabIndex={joined ? 0 : undefined}
                      onClick={() => {
                        if (!joined) return;
                        openGroupAssignments(group.classId);
                      }}
                      onKeyDown={(event) => {
                        if (!joined) return;
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openGroupAssignments(group.classId);
                        }
                      }}
                      className={`rounded-xl border bg-slate-50 p-4 transition ${
                        joined
                          ? "cursor-pointer border-blue-200 hover:border-blue-300 hover:bg-blue-50/50"
                          : "border-slate-200 hover:border-blue-200"
                      }`}
                    >
                      <div className="space-y-1">
                        <h3 className="font-semibold text-slate-900">{group.className}</h3>
                        <p className="text-xs text-slate-500">GV: {group.teacherName || "Cap nhat sau"}</p>
                        <StatusBadge label={group.joinCodeRequired ? "Can ma" : "Public"} tone={group.joinCodeRequired ? "amber" : "emerald"} />
                      </div>
                      <div className="mt-3">
                        {joined ? (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                              Da tham gia
                            </span>
                            <span className="text-xs text-slate-500">
                              {selectedGroupId === group.classId ? "Dang xem bai tap trong nhom" : "Nhan vao the de xem bai tap"}
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={(event) => {
                              // Prevent triggering card click while student is not joined yet.
                              event.stopPropagation();
                              setJoinError(null);
                              if (group.joinCodeRequired) {
                                setJoinModalClass(group);
                              } else {
                                void handleJoinClass(group);
                              }
                            }}
                            disabled={joiningClassId === group.classId}
                            className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
                          >
                            {joiningClassId === group.classId ? "Dang tham gia..." : "Tham gia nhom"}
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-800">Bo loc bai tap</h2>
            {isStudent && selectedGroupName && (
              <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                Dang xem nhom: {selectedGroupName}
              </span>
            )}
            {user?.role === "TEACHER" && (
              <Link
                to="/teacher/assignments"
                className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                Quan ly bai tap
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4" role="search">
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tim theo tieu de"
            />
            {!isStudent && (
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                placeholder="Loc theo classId"
              />
            )}
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
              onClick={() => loadAssignments(1, keyword, isStudent ? { classId: selectedGroupId } : undefined)}
              disabled={isStudent && !selectedGroupId}
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
                if (!isStudent) {
                  setSelectedGroupId("");
                }
                loadAssignments(1, "", {
                  classId: isStudent ? selectedGroupId : "",
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
                {isStudent
                  ? (selectedGroupId
                      ? "Nhom nay hien chua co bai tap phu hop voi bo loc."
                      : "Hay chon mot nhom da tham gia de hien thi bai tap trong nhom do.")
                  : "Chua co bai tap nao phu hop voi bo loc hien tai."}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {items.map((item) => {
                const latest = latestSubmissionMap[item.assignmentId];
                return (
                  <AssignmentCard
                    key={item.assignmentId}
                    assignment={item}
                    classLabel={classNameMap[item.classId] || item.classId}
                    latestSubmission={latest}
                    isTeacher={user?.role === "TEACHER"}
                    isStarting={startingAssignmentId === item.assignmentId}
                    onOpenResult={(submissionId) => navigate(`/submissions/${submissionId}`)}
                    onStart={(assignment) => {
                      if (assignment.passwordRequired) {
                        setStartError(null);
                        setStartPasswordInput("");
                        setStartModalAssignment(assignment);
                        return;
                      }
                      void handleStartAssignment(assignment);
                    }}
                  />
                );
              })}
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

        {joinModalClass && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" role="dialog" aria-modal="true" aria-label="Nhap ma tham gia nhom">
            <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
              <h3 className="text-lg font-semibold text-slate-900">Nhap ma tham gia nhom</h3>
              <p className="mt-1 text-sm text-slate-600">
                Nhom: <span className="font-medium">{joinModalClass.className}</span>
              </p>
              <input
                type="password"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value)}
                placeholder="Nhap ma nhom"
                className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
              {joinError && (
                <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {joinError}
                </div>
              )}
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setJoinModalClass(null);
                    setJoinCodeInput("");
                    setJoinError(null);
                  }}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Huy
                </button>
                <button
                  onClick={() => {
                    if (!joinModalClass) return;
                    void handleJoinClass(joinModalClass, joinCodeInput);
                  }}
                  disabled={!joinCodeInput.trim() || joiningClassId === joinModalClass.classId}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  Xac nhan tham gia
                </button>
              </div>
            </div>
          </div>
        )}

        {startModalAssignment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" role="dialog" aria-modal="true" aria-label="Nhap mat khau bai tap">
            <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
              <h3 className="text-lg font-semibold text-slate-900">Nhap mat khau bai tap</h3>
              <p className="mt-1 text-sm text-slate-600">
                Bai tap: <span className="font-medium">{startModalAssignment.title}</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Mat khau nay khac voi ma tham gia nhom va can nhap lai moi lan bat dau lam bai.
              </p>
              <input
                type="password"
                value={startPasswordInput}
                onChange={(e) => setStartPasswordInput(e.target.value)}
                placeholder="Nhap mat khau bai tap"
                className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              {startError && (
                <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {startError}
                </div>
              )}
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setStartModalAssignment(null);
                    setStartPasswordInput("");
                    setStartError(null);
                  }}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Huy
                </button>
                <button
                  onClick={() => {
                    if (!startModalAssignment) return;
                    void handleStartAssignment(startModalAssignment, startPasswordInput);
                  }}
                  disabled={!startPasswordInput.trim() || startingAssignmentId === startModalAssignment.assignmentId}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  Bat dau lam bai
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default AssignmentListPage;

