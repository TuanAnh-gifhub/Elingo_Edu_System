import { useEffect, useMemo, useState } from "react";
import {
  classRoomService,
  type ClassRoomDto,
  type ClassWalletFinanceSummaryDto,
  type ClassWalletTransactionDto,
} from "../../../services/classes/classRoomService";
import {
  enrollmentService,
  type EnrollmentResponse,
} from "../../../services/classes/enrollmentService";

type ErrorWithResponse = { response?: { data?: { message?: string } } };

type StudentsByClassId = Record<string, EnrollmentResponse[]>;
type StudentsLoadingByClassId = Record<string, boolean>;
type FinanceByClassId = Record<string, ClassWalletFinanceSummaryDto | null>;
type FinanceLoadingByClassId = Record<string, boolean>;
type TransactionsByClassId = Record<string, ClassWalletTransactionDto[]>;
type TransactionsLoadingByClassId = Record<string, boolean>;

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN");
};

const formatCurrency = (value?: number) => {
  const amount = Number(value || 0);
  return amount.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });
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
  const [financeByClassId, setFinanceByClassId] = useState<FinanceByClassId>({});
  const [financeLoadingByClassId, setFinanceLoadingByClassId] =
    useState<FinanceLoadingByClassId>({});
  const [transactionsByClassId, setTransactionsByClassId] =
    useState<TransactionsByClassId>({});
  const [transactionsLoadingByClassId, setTransactionsLoadingByClassId] =
    useState<TransactionsLoadingByClassId>({});
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
      setStudentsByClassId({});
      setFinanceByClassId({});
      setTransactionsByClassId({});
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

    if (!studentsByClassId[classId]) {
      setStudentsLoadingByClassId((current) => ({ ...current, [classId]: true }));
      try {
        const students = await enrollmentService.getEnrollmentsByClassForAdmin(classId);
        setStudentsByClassId((current) => ({ ...current, [classId]: students }));
      } catch {
        setStudentsByClassId((current) => ({ ...current, [classId]: [] }));
      } finally {
        setStudentsLoadingByClassId((current) => ({ ...current, [classId]: false }));
      }
    }

    if (!financeByClassId[classId]) {
      setFinanceLoadingByClassId((current) => ({ ...current, [classId]: true }));
      try {
        const finance = await classRoomService.getClassWalletFinanceSummaryForAdmin(classId);
        setFinanceByClassId((current) => ({ ...current, [classId]: finance }));
      } catch {
        setFinanceByClassId((current) => ({ ...current, [classId]: null }));
      } finally {
        setFinanceLoadingByClassId((current) => ({ ...current, [classId]: false }));
      }
    }

    if (!transactionsByClassId[classId]) {
      setTransactionsLoadingByClassId((current) => ({ ...current, [classId]: true }));
      try {
        const transactions =
          await classRoomService.getClassWalletTransactionsForAdmin(classId);
        setTransactionsByClassId((current) => ({
          ...current,
          [classId]: transactions,
        }));
      } catch {
        setTransactionsByClassId((current) => ({ ...current, [classId]: [] }));
      } finally {
        setTransactionsLoadingByClassId((current) => ({
          ...current,
          [classId]: false,
        }));
      }
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
              const finance = financeByClassId[classId];
              const loadingFinance = financeLoadingByClassId[classId] || false;
              const transactions = transactionsByClassId[classId] || [];
              const loadingTransactions =
                transactionsLoadingByClassId[classId] || false;

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

                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-2 text-sm">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                      <div className="text-slate-500 text-xs">Số dư ví lớp</div>
                      <div className="font-semibold text-slate-900">
                        {loadingFinance
                          ? "Đang tải..."
                          : formatCurrency(finance?.classWalletBalance)}
                      </div>
                    </div>
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-2">
                      <div className="text-amber-700 text-xs">Lợi nhuận nền tảng sắp thu</div>
                      <div className="font-semibold text-amber-800">
                        {loadingFinance
                          ? "Đang tải..."
                          : formatCurrency(finance?.platformUpcomingProfit)}
                      </div>
                    </div>
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-2">
                      <div className="text-amber-700 text-xs">Lợi nhuận nền tảng đã thu</div>
                      <div className="font-semibold text-amber-800">
                        {loadingFinance
                          ? "Đang tải..."
                          : formatCurrency(finance?.platformReceivedProfit)}
                      </div>
                    </div>
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2">
                      <div className="text-emerald-700 text-xs">Giáo viên sắp nhận</div>
                      <div className="font-semibold text-emerald-800">
                        {loadingFinance
                          ? "Đang tải..."
                          : formatCurrency(finance?.teacherUpcomingReceivable)}
                      </div>
                    </div>
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2">
                      <div className="text-emerald-700 text-xs">Giáo viên đã nhận</div>
                      <div className="font-semibold text-emerald-800">
                        {loadingFinance
                          ? "Đang tải..."
                          : formatCurrency(finance?.teacherReceivedAmount)}
                      </div>
                    </div>
                  </div>

                  {!loadingFinance && finance ? (
                    <div className="mt-2 text-xs text-slate-500">
                      Tỉ lệ phí hiện tại: {finance.feePercent ?? 0}%
                    </div>
                  ) : null}

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

                      <div className="mt-4">
                        <h4 className="text-sm font-semibold text-slate-900 mb-2">
                          Lịch sử giao dịch ví lớp
                        </h4>

                        {loadingTransactions ? (
                          <p className="text-sm text-slate-500">Đang tải lịch sử giao dịch...</p>
                        ) : null}

                        {!loadingTransactions && transactions.length === 0 ? (
                          <p className="text-sm text-slate-500">Chưa có giao dịch ví lớp.</p>
                        ) : null}

                        {!loadingTransactions && transactions.length > 0 ? (
                          <div className="overflow-x-auto rounded-lg border border-slate-200">
                            <table className="min-w-full text-sm">
                              <thead className="bg-slate-50 text-slate-600">
                                <tr>
                                  <th className="px-3 py-2 text-left">Thời gian</th>
                                  <th className="px-3 py-2 text-left">Loại</th>
                                  <th className="px-3 py-2 text-left">Số tiền</th>
                                  <th className="px-3 py-2 text-left">Phí</th>
                                  <th className="px-3 py-2 text-left">Giáo viên nhận</th>
                                  <th className="px-3 py-2 text-left">Mô tả</th>
                                </tr>
                              </thead>
                              <tbody>
                                {transactions.map((transaction) => (
                                  <tr
                                    key={transaction.transactionId}
                                    className="border-t border-slate-100"
                                  >
                                    <td className="px-3 py-2 text-slate-600">
                                      {formatDateTime(transaction.transactionTime)}
                                    </td>
                                    <td className="px-3 py-2 font-medium text-slate-800">
                                      {transaction.transactionType === "CLASS_WALLET_IN"
                                        ? "Nạp vào ví lớp"
                                        : "Rút từ ví lớp"}
                                    </td>
                                    <td className="px-3 py-2 text-slate-700">
                                      {formatCurrency(transaction.grossAmount ?? transaction.amount)}
                                    </td>
                                    <td className="px-3 py-2 text-amber-700">
                                      {formatCurrency(transaction.feeAmount)}
                                    </td>
                                    <td className="px-3 py-2 text-emerald-700">
                                      {formatCurrency(
                                        transaction.receivableAmount ?? transaction.amount,
                                      )}
                                    </td>
                                    <td className="px-3 py-2 text-slate-600">
                                      {transaction.description || "-"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : null}
                      </div>
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

