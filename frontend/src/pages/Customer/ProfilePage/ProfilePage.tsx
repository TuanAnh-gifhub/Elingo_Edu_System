import { Link, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  FiCalendar,
  FiMail,
  FiPhone,
  FiShield,
  FiUser,
  FiCheckCircle,
  FiCreditCard,
} from "react-icons/fi";
import { useAuth } from "../../../context/AuthContext";
import {
  teacherService,
  type TeacherVerificationResponse,
} from "../../../services/teachers/teacherService";

const formatDate = (dateString?: string) => {
  if (!dateString) return "Chưa cập nhật";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Chưa cập nhật";
  return date.toLocaleDateString("vi-VN");
};

const ProfilePage = () => {
  const { isAuthenticated, user } = useAuth();
  const [verificationRequest, setVerificationRequest] =
    useState<TeacherVerificationResponse | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    let isMounted = true;

    teacherService
      .getMyVerificationRequest()
      .then((request) => {
        if (isMounted) {
          setVerificationRequest(request);
        }
      })
      .catch(() => {
        if (isMounted) {
          setVerificationRequest(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user]);

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    user.userName || "User",
  )}&background=4da6ff&color=fff&size=256`;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Thông tin cá nhân</h1>
        <p className="mt-1 text-sm text-slate-500">
          Quản lý thông tin tài khoản Elingo của bạn.
        </p>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-linear-to-r from-sky-500 to-blue-600 p-6 text-white">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <img
              src={avatarUrl}
              alt={user.userName}
              className="h-20 w-20 rounded-full border-4 border-white/70 object-cover"
            />
            <div>
              <h2 className="text-xl font-bold">{user.userName}</h2>
              <p className="text-sm text-blue-50">{user.email}</p>
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                <FiShield className="h-3.5 w-3.5" />
                Vai trò: {user.role}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="mb-3 text-sm font-semibold text-slate-800">Thông tin cơ bản</p>
            <div className="space-y-3 text-sm text-slate-700">
              <div className="flex items-center gap-2">
                <FiUser className="h-4 w-4 text-sky-600" />
                <span>Tên hiển thị: {user.userName || "Chưa cập nhật"}</span>
              </div>
              <div className="flex items-center gap-2">
                <FiMail className="h-4 w-4 text-sky-600" />
                <span>Email: {user.email || "Chưa cập nhật"}</span>
              </div>
              <div className="flex items-center gap-2">
                <FiPhone className="h-4 w-4 text-sky-600" />
                <span>Số điện thoại: {user.phone || "Chưa cập nhật"}</span>
              </div>
              <div className="flex items-center gap-2">
                <FiCalendar className="h-4 w-4 text-sky-600" />
                <span>Ngày sinh: {formatDate(user.dateOfBirth)}</span>
              </div>
              <div className="flex items-center gap-2">
                <FiCalendar className="h-4 w-4 text-sky-600" />
                <span>Ngày tham gia: {formatDate(user.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <p className="mb-3 text-sm font-semibold text-slate-800">Trạng thái tài khoản</p>
            <div className="space-y-3 text-sm text-slate-700">
              <div className="flex items-center gap-2">
                <FiCheckCircle className="h-4 w-4 text-emerald-500" />
                <span>
                  Tài khoản: {user.active ? "Đang hoạt động" : "Đang tạm khóa"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FiMail className="h-4 w-4 text-sky-600" />
                <span>
                  Trạng thái email: {user.emailVerified === false ? "Chưa xác minh" : "Đã xác minh"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FiShield className="h-4 w-4 text-sky-600" />
                <span>Giới tính: {user.gender || "Chưa cập nhật"}</span>
              </div>
              <div className="flex items-center gap-2">
                <FiUser className="h-4 w-4 text-sky-600" />
                <span>Tuổi: {user.age ?? "Chưa cập nhật"}</span>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/wallet"
                className="inline-flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-100"
              >
                <FiCreditCard className="h-4 w-4" />
                Đi tới ví
              </Link>
              <Link
                to="/teacher-verification"
                className="inline-flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
              >
                <FiShield className="h-4 w-4" />
                Xác minh giáo viên
              </Link>
            </div>

            {verificationRequest ? (
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {verificationRequest.status === "PENDING" ? (
                  <span>Đang chờ duyệt</span>
                ) : null}
                {verificationRequest.status === "APPROVED" ? (
                  <span>Bạn đã là giáo viên</span>
                ) : null}
                {verificationRequest.status === "REJECTED" ? (
                  <span>
                    Đã bị từ chối
                    {verificationRequest.adminNote ? ` - ${verificationRequest.adminNote}` : ""}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
};

export { ProfilePage };
export default ProfilePage;

