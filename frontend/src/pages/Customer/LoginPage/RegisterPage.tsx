/* eslint-disable react-refresh/only-export-components */
import React, { useState } from "react";
import { message } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaEnvelope,
  FaLock,
  FaPhone,
  FaUser,
  FaTimes,
} from "react-icons/fa";
import authService, {
  type CreateUsersRequest,
} from "../../../services/auth/authService";
import loginIntroVideo from "../../../assets/login_intro_video.mp4";

export interface RegisterPageProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export type RegisterFormValues = {
  userName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  // Cho phép "" để LoginPage có thể dùng cùng type (ban đầu chưa chọn giới tính)
  gender: "" | "MALE" | "FEMALE";
  dateOfBirth: string;
};

// Hàm validate dùng chung cho cả RegisterPage và LoginPage
export const validateRegisterFormValues = (
  values: RegisterFormValues,
): string | null => {
  if (!values.userName.trim()) return "Vui lòng nhập họ và tên.";
  if (!values.email.trim()) return "Vui lòng nhập email.";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(values.email)) return "Email không hợp lệ.";

  if (values.phone && !/^0\d{9,10}$/.test(values.phone)) {
    return "Số điện thoại không hợp lệ.";
  }

  if (!values.dateOfBirth) return "Vui lòng chọn ngày sinh.";
  if (!values.gender) return "Vui lòng chọn giới tính.";

  if (!values.password) return "Vui lòng nhập mật khẩu.";
  if (values.password.length < 8) {
    return "Mật khẩu tối thiểu 8 ký tự.";
  }

  if (!values.confirmPassword) return "Vui lòng nhập lại mật khẩu.";
  if (values.password !== values.confirmPassword) {
    return "Mật khẩu nhập lại không khớp.";
  }

  return null;
};

const RegisterPage: React.FC<RegisterPageProps> = ({
  isOpen,
  onClose,
  onSwitchToLogin,
}) => {
  const [formValues, setFormValues] = useState<RegisterFormValues>({
    userName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    gender: "MALE",
    dateOfBirth: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange =
    (field: keyof RegisterFormValues) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const value = e.target.value;
        setFormValues((prev) => ({ ...prev, [field]: value }));
      };

  const validateForm = (): string | null => validateRegisterFormValues(formValues);

  const resetStates = () => {
    setErrorMessage("");
    setSuccessMessage("");
  };

  const onFinish = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    resetStates();

    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setLoading(true);
    try {
      const payload: CreateUsersRequest = {
        userName: formValues.userName.trim(),
        email: formValues.email.trim(),
        password: formValues.password,
        phone: formValues.phone ?? "",
        gender: formValues.gender,
        dateOfBirth: formValues.dateOfBirth,
        roleName: "STUDENT",
      };

      const response = await authService.registerRequest(payload);

      // Kiểm tra logic response tùy theo API của bạn
      if (response && response.code === 200) {
        setLoading(false);
        setSuccessMessage(
          "Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.",
        );

        // THÊM DÒNG NÀY ĐỂ HIỆN MESSAGE POP-UP
        message.success(response.message || "Đăng ký thành công!");

        // Reset form
        setFormValues({
          userName: "",
          email: "",
          password: "",
          confirmPassword: "",
          phone: "",
          gender: "MALE",
          dateOfBirth: "",
        });
      } else {
        setLoading(false);
        setErrorMessage(
          response?.message || "Đăng ký thất bại. Vui lòng thử lại!",
        );
        message.error(
          response?.message || "Đăng ký thất bại. Vui lòng thử lại!",
        );
      }
    } catch (error: unknown) {
      console.error("Register Error:", error);
      setLoading(false);

      // Lấy message lỗi từ Server trả về (nếu có dạng response.data.message)
      const errorMsg =
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
          : "Lỗi kết nối máy chủ!";
      setErrorMessage(errorMsg);
      message.error(errorMsg);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
        {/* Backdrop giống LoginPage */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-gray-200"
        >
          {/* Close button (global) */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-20 w-8 h-8 bg-black/30 hover:bg-black/40 rounded-full flex items-center justify-center transition-colors"
            aria-label="Đóng"
          >
            <FaTimes className="w-3.5 h-3.5 text-white" />
          </button>

          <div className="relative h-[520px] w-full bg-black">
            {/* Video nền full modal */}
            <video
              className="absolute inset-0 h-full w-full object-cover"
              src={loginIntroVideo}
              autoPlay
              loop
              muted
              playsInline
            />
            <div className="absolute inset-0 bg-black/40" />

            {/* Thông tin thương hiệu trên video */}
            <div className="absolute bottom-4 right-4 text-white hidden md:block text-right">
              <div className="text-lg font-semibold">Elingo</div>
              <div className="text-sm text-white/90">
                Đăng ký ngay để bắt đầu.
              </div>
            </div>

            {/* Thẻ form đè bên trái video */}
            <div className="relative z-10 flex h-full items-center justify-start px-4 sm:px-6">
              <div className="w-full max-w-sm bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl flex flex-col overflow-hidden text-sm">
                {/* Header */}
                <div className="relative bg-linear-to-br from-[#4da6ff] to-blue-500 px-5 py-3.5 text-white">
                  <div className="flex justify-center mb-2">
                    <div className="w-10 h-10 border-2 border-white rounded-lg flex items-center justify-center">
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                    </div>
                  </div>
                  <h2 className="text-xl font-bold text-center">Tạo Tài Khoản</h2>
                  <p className="text-center text-white/80 text-sm">
                    Đăng ký ngay để bắt đầu
                  </p>
                </div>

                <div className="px-5 py-2.5 flex-1 overflow-y-auto">
                  {/* Alert lỗi */}
                  {errorMessage && (
                    <div className="mb-2 p-1.5 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg text-center font-medium">
                      {errorMessage}
                    </div>
                  )}

                  {/* Alert thành công */}
                  {successMessage && (
                    <div className="mb-2 p-1.5 bg-green-50 border border-green-200 text-green-600 text-sm rounded-lg text-center font-medium">
                      {successMessage}
                    </div>
                  )}

                  <form onSubmit={onFinish} className="space-y-2.5">
                    {/* Họ và tên + SĐT */}
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-7">
                        <div className="relative">
                          <div className="absolute left-2 top-1/2 -translate-y-1/2">
                            <FaUser className="w-4 h-4 text-blue-600/70" />
                          </div>
                          <input
                            type="text"
                            value={formValues.userName}
                            onChange={handleChange("userName")}
                            placeholder=" "
                            className="peer w-full rounded-lg border border-gray-300 bg-gray-100 text-gray-900 text-sm pl-8 pr-3 pt-3.5 pb-1.5 transition-all duration-150 focus:outline-none focus:border-blue-600 focus:bg-white focus:shadow-[0_0_0_1px_#2563eb]"
                            disabled={loading}
                            required
                          />
                          <label className="pointer-events-none absolute left-8 top-1/2 -translate-y-1/2 rounded-full bg-gray-100 px-1 text-sm text-gray-600 z-10 transition-all duration-150 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-[0.65rem] peer-focus:text-blue-700 peer-focus:font-semibold peer-focus:border-t peer-focus:border-blue-600 peer-[&:not(:placeholder-shown)]:top-0 peer-[&:not(:placeholder-shown)]:-translate-y-1/2 peer-[&:not(:placeholder-shown)]:text-[0.65rem] peer-[&:not(:placeholder-shown)]:text-blue-700 peer-[&:not(:placeholder-shown)]:font-semibold">
                            Họ và tên
                          </label>
                        </div>
                      </div>

                      <div className="col-span-5">
                        <div className="relative">
                          <div className="absolute left-2 top-1/2 -translate-y-1/2">
                            <FaPhone className="w-4 h-4 text-gray-400" />
                          </div>
                          <input
                            type="tel"
                            value={formValues.phone}
                            onChange={handleChange("phone")}
                            placeholder=" "
                            className="peer w-full rounded-lg border border-gray-300 bg-gray-100 text-gray-900 text-sm pl-8 pr-3 pt-3.5 pb-1.5 transition-all duration-150 focus:outline-none focus:border-blue-600 focus:bg-white focus:shadow-[0_0_0_1px_#2563eb]"
                            disabled={loading}
                            pattern="^0\d{9,10}$"
                          />
                          <label className="pointer-events-none absolute left-8 top-1/2 -translate-y-1/2 rounded-full bg-gray-100 px-1 text-sm text-gray-600 z-10 transition-all duration-150 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-[0.65rem] peer-focus:text-blue-700 peer-focus:font-semibold peer-focus:border-t peer-focus:border-blue-600 peer-[&:not(:placeholder-shown)]:top-0 peer-[&:not(:placeholder-shown)]:-translate-y-1/2 peer-[&:not(:placeholder-shown)]:text-[0.65rem] peer-[&:not(:placeholder-shown)]:text-blue-700 peer-[&:not(:placeholder-shown)]:font-semibold">
                            SĐT
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Ngày sinh + Giới tính */}
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-7">
                        <div className="relative">
                          <input
                            type="date"
                            value={formValues.dateOfBirth}
                            onChange={handleChange("dateOfBirth")}
                            placeholder=" "
                            className="peer w-full rounded-lg border border-gray-300 bg-gray-100 text-gray-900 text-sm px-3 pt-3.5 pb-1.5 transition-all duration-150 focus:outline-none focus:border-blue-600 focus:bg-white focus:shadow-[0_0_0_1px_#2563eb]"
                            disabled={loading}
                            required
                          />
                          <label className="pointer-events-none absolute left-3 top-0 -translate-y-1/2 rounded-full bg-gray-100 px-1 text-sm text-gray-700 z-10 transition-all duration-150 peer-focus:text-blue-700 peer-focus:font-semibold peer-focus:border-t peer-focus:border-blue-600">
                            Ngày sinh
                          </label>
                        </div>
                      </div>

                      <div className="col-span-5">
                        <div className="relative">
                          <select
                            value={formValues.gender}
                            onChange={handleChange("gender")}
                            className="peer w-full rounded-lg border border-gray-300 bg-gray-100 text-gray-900 text-sm px-3 pt-3.5 pb-1.5 transition-all duration-150 focus:outline-none focus:border-blue-600 focus:bg-white focus:shadow-[0_0_0_1px_#2563eb]"
                            disabled={loading}
                          >
                            <option value="MALE">Nam</option>
                            <option value="FEMALE">Nữ</option>
                          </select>
                          <label className="pointer-events-none absolute left-3 top-0 -translate-y-1/2 rounded-full bg-gray-100 px-1 text-sm text-gray-700 z-10 transition-all duration-150 peer-focus:text-blue-700 peer-focus:font-semibold peer-focus:border-t peer-focus:border-blue-600">
                            Giới tính
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <div className="relative">
                        <div className="absolute left-2 top-1/2 -translate-y-1/2">
                          <FaEnvelope className="w-4 h-4 text-gray-400" />
                        </div>
                        <input
                          type="email"
                          value={formValues.email}
                          onChange={handleChange("email")}
                          placeholder=" "
                          className="peer w-full rounded-lg border border-gray-300 bg-gray-100 text-gray-900 text-sm pl-8 pr-3 pt-3.5 pb-1.5 transition-all duration-150 focus:outline-none focus:border-blue-600 focus:bg-white focus:shadow-[0_0_0_1px_#2563eb]"
                          disabled={loading}
                          required
                        />
                        <label className="pointer-events-none absolute left-8 top-1/2 -translate-y-1/2 rounded-full bg-gray-100 px-1 text-sm text-gray-600 z-10 transition-all duration-150 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-[0.65rem] peer-focus:text-blue-700 peer-focus:font-semibold peer-focus:border-t peer-focus:border-blue-600 peer-[&:not(:placeholder-shown)]:top-0 peer-[&:not(:placeholder-shown)]:-translate-y-1/2 peer-[&:not(:placeholder-shown)]:text-[0.65rem] peer-[&:not(:placeholder-shown)]:text-blue-700 peer-[&:not(:placeholder-shown)]:font-semibold">
                          Email
                        </label>
                      </div>
                    </div>

                    {/* Mật khẩu + Nhập lại mật khẩu */}
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-6">
                        <div className="relative">
                          <div className="absolute left-2 top-1/2 -translate-y-1/2">
                            <FaLock className="w-4 h-4 text-gray-400" />
                          </div>
                          <input
                            type="password"
                            value={formValues.password}
                            onChange={handleChange("password")}
                            placeholder=" "
                            className="peer w-full rounded-lg border border-gray-300 bg-gray-100 text-gray-900 text-sm pl-8 pr-3 pt-3.5 pb-1.5 transition-all duration-150 focus:outline-none focus:border-blue-600 focus:bg-white focus:shadow-[0_0_0_1px_#2563eb]"
                            disabled={loading}
                            required
                            minLength={8}
                          />
                          <label className="pointer-events-none absolute left-8 top-1/2 -translate-y-1/2 rounded-full bg-gray-100 px-1 text-sm text-gray-600 z-10 transition-all duration-150 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-[0.65rem] peer-focus:text-blue-700 peer-focus:font-semibold peer-focus:border-t peer-focus:border-blue-600 peer-[&:not(:placeholder-shown)]:top-0 peer-[&:not(:placeholder-shown)]:-translate-y-1/2 peer-[&:not(:placeholder-shown)]:text-[0.65rem] peer-[&:not(:placeholder-shown)]:text-blue-700 peer-[&:not(:placeholder-shown)]:font-semibold">
                            Mật khẩu
                          </label>
                        </div>
                      </div>

                      <div className="col-span-6">
                        <div className="relative">
                          <div className="absolute left-2 top-1/2 -translate-y-1/2">
                            <FaLock className="w-4 h-4 text-gray-400" />
                          </div>
                          <input
                            type="password"
                            value={formValues.confirmPassword}
                            onChange={handleChange("confirmPassword")}
                            placeholder=" "
                            className="peer w-full rounded-lg border border-gray-300 bg-gray-100 text-gray-900 text-sm pl-8 pr-3 pt-3.5 pb-1.5 transition-all duration-150 focus:outline-none focus:border-blue-600 focus:bg-white focus:shadow-[0_0_0_1px_#2563eb]"
                            disabled={loading}
                            required
                            minLength={8}
                          />
                          <label className="pointer-events-none absolute left-8 top-1/2 -translate-y-1/2 rounded-full bg-gray-100 px-1 text-sm text-gray-600 z-10 transition-all duration-150 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-[0.65rem] peer-focus:text-blue-700 peer-focus:font-semibold peer-focus:border-t peer-focus:border-blue-600 peer-[&:not(:placeholder-shown)]:top-0 peer-[&:not(:placeholder-shown)]:-translate-y-1/2 peer-[&:not(:placeholder-shown)]:text-[0.65rem] peer-[&:not(:placeholder-shown)]:text-blue-700 peer-[&:not(:placeholder-shown)]:font-semibold">
                            Nhập lại mật khẩu
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={loading}
                      className={`w-full bg-[#4da6ff] hover:bg-[#3d8cff] text-white font-semibold py-1.5 px-4 rounded-lg transition-colors shadow-md hover:shadow-lg text-sm mt-1 ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
                    >
                      {loading ? "Đang xử lý..." : "Tiếp tục"}
                    </button>

                    {/* Đã có tài khoản? */}
                    <div className="mt-2 text-center">
                      <span className="text-sm text-gray-700">
                        Đã có tài khoản?{" "}
                      </span>
                      <button
                        type="button"
                        onClick={onSwitchToLogin}
                        className="text-sm text-[#4da6ff] hover:text-blue-600 font-semibold focus:outline-none"
                      >
                        Đăng nhập
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default RegisterPage;
