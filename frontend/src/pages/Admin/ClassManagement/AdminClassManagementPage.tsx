import { useEffect, useMemo, useState } from "react";
import {
  classRoomService,
  type ClassRoomDto,
} from "../../../services/classes/classRoomService";
import {
  enrollmentService,
  type EnrollmentResponse,
} from "../../../services/classes/enrollmentService";

type ErrorWithResponse = { response?: { data?: { message?: string } } };

type StudentsByClassId = Record<string, EnrollmentResponse[]>;
type StudentsLoadingByClassId = Record<string, boolean>;

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN");
};

const AdminClassManagementPage = () => {
  const [classes, setClasses] = useState<ClassRoomDto[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [studentsByClassId, setStudentsByClassId] =
    useState<StudentsByClassId>({});
  const [studentsLoadingByClassId, setStudentsLoadingByClassId] =
    useState<StudentsLoadingByClassId>({});
  const [openClassId, setOpenClassId] = useState<string | null>(null);

  const loadClasses = async () => {
    setLoadingClasses(true);
    setError(null);

    try {
      const response = await classRoomService.getClasses(1, 200, {
        keyword: keyword.trim() || undefined,
      });
      setClasses(response.data || []);
      setOpenClassId(null);
    } catch (e: unknown) {
      const err = e as ErrorWithResponse;
      setError(err?.response?.data?.message || "Không thể tải danh sách lớp học.");
      setClasses([]);
    } finally {
      setLoadingClasses(false);
    }
  };

  useEffect(() => {
    void loadClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const teachers = useMemo(() => {
    const map = new Map<string, { teacherName: string; teacherEmail: string; classCount: number }>();

    classes.forEach((item) => {
      const teacherId = item.teacherId || "unknown-teacher";
      const existing = map.get(teacherId);
      if (existing) {
        map.set(teacherId, {
          ...existing,
          classCount: existing.classCount + 1,
        });
        return;
      }

      map.set(teacherId, {
        teacherName: item.teacherName || "Giáo viên chưa cập nhật",
        teacherEmail: item.teacherEmail || "-",
        classCount: 1,
      });
    });

    return Array.from(map.values());
  }, [classes]);

  const toggleClassStudents = async (classId: string) => {
    if (openClassId === classId) {
      setOpenClassId(null);
      return;
    }

    setOpenClassId(classId);

    if (studentsByClassId[classId]) {
      return;
    }

    setStudentsLoadingByClassId((current) => ({ ...current, [classId]: true }));

    try {
      const students = await enrollmentService.getEnrollmentsByClassForAdmin(classId);
      setStudentsByClassId((current) => ({ ...current, [classId]: students }));
    } catch {
      setStudentsByClassId((current) => ({ ...current, [classId]: [] }));
    } finally {
      setStudentsLoadingByClassId((current) => ({ ...current, [classId]: false }));
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý lớp học</h1>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi toàn bộ lớp học, danh sách giáo viên và học sinh đã đăng ký.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadClasses()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Tải lại
        </button>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="rounded-lg border border-slate-200 p-3">
            <div className="text-slate-500">Tổng số lớp học</div>
            <div className="text-2xl font-bold text-slate-900">{classes.length}</div>
          </div>
          <div className="rounded-lg border border-slate-200 p-3">
            <div className="text-slate-500">Tổng số giáo viên có lớp</div>
            <div className="text-2xl font-bold text-slate-900">{teachers.length}</div>
          </div>
          <div className="rounded-lg border border-slate-200 p-3">
            <div className="text-slate-500">Lớp đang hoạt động</div>
            <div className="text-2xl font-bold text-emerald-700">
              {classes.filter((item) => item.active).length}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <h2 className="text-base font-semibold text-slate-900">Danh sách giáo viên</h2>
        {teachers.length === 0 ? (
          <p className="text-sm text-slate-500">Chưa có giáo viên nào có lớp học.</p>
        ) : (
          <div className="space-y-2">
            {teachers.map((teacher, index) => (
              <div key={`${teacher.teacherEmail}-${index}`} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <div className="font-semibold text-slate-900">{teacher.teacherName}</div>
                <div className="text-slate-500">{teacher.teacherEmail}</div>
                <div className="text-xs text-slate-500 mt-1">{teacher.classCount} lớp đang quản lý</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tìm theo tên lớp hoặc tên giáo viên..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => void loadClasses()}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
          >
            Lọc
          </button>
        </div>

        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {loadingClasses ? <p className="text-sm text-slate-500">Đang tải lớp học...</p> : null}

        {!loadingClasses && classes.length === 0 ? (
          <p className="text-sm text-slate-500">Không có lớp học nào.</p>
        ) : null}

        {!loadingClasses ? (
          <div className="space-y-3">
            {classes.map((item) => {
              const classId = item.classId;
              const students = studentsByClassId[classId] || [];
              const loadingStudents = studentsLoadingByClassId[classId] || false;

              return (
                <article key={classId} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="space-y-1 min-w-0">
                      <h3 className="font-semibold text-slate-900">{item.className}</h3>
                      <div className="text-sm text-slate-600">Giáo viên: {item.teacherName || "-"}</div>
                      <div className="text-xs text-slate-500">{item.teacherEmail || "-"}</div>
                      <div className="text-xs text-slate-500">
                        Sĩ số: {item.currentStudents ?? 0}/{item.maxStudents ?? "-"} · Trạng thái: {item.active ? "Hoạt động" : "Ngưng"}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => void toggleClassStudents(classId)}
                      className="rounded-lg border border-blue-300 px-3 py-2 text-sm font-semibold text-blue-700"
                    >
                      {openClassId === classId ? "Ẩn học sinh" : "Xem học sinh"}
                    </button>
                  </div>

                  {openClassId === classId ? (
                    <div className="mt-3 border-t border-slate-100 pt-3">
                      {loadingStudents ? <p className="text-sm text-slate-500">Đang tải danh sách học sinh...</p> : null}

                      {!loadingStudents && students.length === 0 ? (
                        <p className="text-sm text-slate-500">Chưa có học sinh đăng ký lớp này.</p>
                      ) : null}

                      {!loadingStudents && students.length > 0 ? (
                        <div className="space-y-2">
                          {students.map((student) => (
                            <div key={student.enrollmentId} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                              <div className="font-semibold text-slate-900">{student.studentName || "Học sinh"}</div>
                              <div className="text-xs text-slate-500 mt-0.5">
                                Thời gian đăng ký: {formatDateTime(student.enrollmentDate)}
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5">
                                Thanh toán: {student.paymentStatus || "-"}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : null}
      </section>
    </div>
  );
};

export default AdminClassManagementPage;

