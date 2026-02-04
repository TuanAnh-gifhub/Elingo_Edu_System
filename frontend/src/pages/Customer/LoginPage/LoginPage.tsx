import { useState } from "react";
import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaTimes,
  FaArrowLeft,
  FaUser,
} from "react-icons/fa";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { message } from "antd";
import { useGoogleLogin } from "@react-oauth/google";
import authService, {
  type ApiResponse as AuthApiResponse,
  type LoginResponse,
  type LoginGoogleResponse,
  type CreateUsersRequest,
} from "../../../services/auth/authService";
import { useAuth } from "../../../context/AuthContext";
import type { UserResponse } from "../../../services/usersService";
import loginIntroVideo from "../../../assets/login_intro_video.mp4";
interface LoginPageProps {
  isOpen: boolean;
  onClose: () => void;
}

type RegisterFormValues = {
  userName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  gender: "MALE" | "FEMALE";
  dateOfBirth: string;
};

const LoginPage = ({ isOpen, onClose }: LoginPageProps) => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [registerFormValues, setRegisterFormValues] = useState<RegisterFormValues>({
    userName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    gender: "MALE",
    dateOfBirth: "",
  });
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);
  const panelControls = useAnimation();
  const [isPanelAnimating, setIsPanelAnimating] = useState(false);

  const resetForm = () => {
    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(false);
    setIsForgotPasswordMode(false);
    setIsRegisterMode(false);
    setEmail("");
    setPassword("");
    setRegisterFormValues({
      userName: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      gender: "MALE",
      dateOfBirth: "",
    });
    setIsRegisterLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleLoginSuccess = (userData: UserResponse) => {
    login(userData);

    message.success({
      content: "Đăng nhập thành công!",
      duration: 3,
    });

    handleClose();
    setEmail("");
    setPassword("");
  };

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const res: AuthApiResponse<LoginResponse> = await authService.login({
        email,
        password,
      });
      if (res && res.code === 200) {
        const meResponse = await authService.getCurrentUser();
        if (meResponse && meResponse.result) {
          await handleLoginSuccess(meResponse.result);
        }
      } else {
        setErrorMessage("Đăng nhập thất bại. Vui lòng thử lại.");
      }
    } catch (error: unknown) {
      const errorResponse =
        typeof error === "object" &&
          error !== null &&
          "response" in error &&
          (error as { response?: { data?: unknown } }).response?.data
          ? (error as { response?: { data?: { message?: string; code?: number } } })
            .response!.data
          : undefined;

      if (errorResponse?.code === 1000) {
        setErrorMessage("Email hoặc mật khẩu không chính xác.");
      } else if (errorResponse?.message?.includes("Google")) {
        setErrorMessage(
          "Tài khoản này được liên kết với Google. Vui lòng chọn 'Đăng nhập với Google'.",
        );
      } else {
        setErrorMessage(errorResponse?.message || "Lỗi kết nối server.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    if (!email) {
      setErrorMessage("Vui lòng nhập email của bạn.");
      setIsLoading(false);
      return;
    }

    try {
      await authService.forgotPassword(email);
      setSuccessMessage(
        "Link đặt lại mật khẩu đã được gửi vào email của bạn. Vui lòng kiểm tra hộp thư.",
      );
    } catch (error: unknown) {
      console.error("Forgot password failed:", error);
      const errorResponse =
        typeof error === "object" &&
          error !== null &&
          "response" in error &&
          (error as { response?: { data?: { message?: string } } }).response?.data
          ? (error as { response?: { data?: { message?: string } } }).response!.data
          : undefined;
      setErrorMessage(
        errorResponse?.message ||
        "Không thể gửi yêu cầu. Vui lòng kiểm tra lại email.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterChange =
    (field: keyof RegisterFormValues) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const value = e.target.value;
        setRegisterFormValues((prev) => ({ ...prev, [field]: value }));
      };

  const validateRegisterForm = (): string | null => {
    if (!registerFormValues.userName.trim()) return "Vui lòng nhập họ và tên.";
    if (!registerFormValues.email.trim()) return "Vui lòng nhập email.";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerFormValues.email)) return "Email không hợp lệ.";

    if (registerFormValues.phone && !/^0\d{9,10}$/.test(registerFormValues.phone)) {
      return "Số điện thoại không hợp lệ.";
    }

    if (!registerFormValues.dateOfBirth) return "Vui lòng chọn ngày sinh.";
    if (!registerFormValues.gender) return "Vui lòng chọn giới tính.";

    if (!registerFormValues.password) return "Vui lòng nhập mật khẩu.";
    if (registerFormValues.password.length < 8) {
      return "Mật khẩu tối thiểu 8 ký tự.";
    }

    if (!registerFormValues.confirmPassword) return "Vui lòng nhập lại mật khẩu.";
    if (registerFormValues.password !== registerFormValues.confirmPassword) {
      return "Mật khẩu nhập lại không khớp.";
    }

    return null;
  };

  const handleRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const validationError = validateRegisterForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsRegisterLoading(true);
    try {
      const payload: CreateUsersRequest = {
        userName: registerFormValues.userName.trim(),
        email: registerFormValues.email.trim(),
        password: registerFormValues.password,
        phone: registerFormValues.phone ?? "",
        gender: registerFormValues.gender,
        dateOfBirth: registerFormValues.dateOfBirth,
        roleName: "RENTER",
      };

      const response = await authService.registerRequest(payload);

      if (response && response.code === 200) {
        setSuccessMessage(
          "Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.",
        );
        message.success(response.message || "Đăng ký thành công!");

        setRegisterFormValues({
          userName: "",
          email: "",
          password: "",
          confirmPassword: "",
          phone: "",
          gender: "MALE",
          dateOfBirth: "",
        });
      } else {
        setErrorMessage(
          response?.message || "Đăng ký thất bại. Vui lòng thử lại!",
        );
        message.error(
          response?.message || "Đăng ký thất bại. Vui lòng thử lại!",
        );
      }
    } catch (error: unknown) {
      console.error("Register Error:", error);
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
    } finally {
      setIsRegisterLoading(false);
    }
  };

  const slideToRegister = async () => {
    if (isRegisterMode || isPanelAnimating) return;
    setIsPanelAnimating(true);

    await panelControls.start({
      x: "60%",
      transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
    });

    setIsRegisterMode(true);
    setIsForgotPasswordMode(false);
    setErrorMessage("");
    setSuccessMessage("");

    await panelControls.start({
      x: "0%",
      transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
    });

    setIsPanelAnimating(false);
  };

  const slideToLogin = async () => {
    if (!isRegisterMode || isPanelAnimating) return;
    setIsPanelAnimating(true);

    await panelControls.start({
      x: "-60%",
      transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
    });

    setIsRegisterMode(false);
    setErrorMessage("");
    setSuccessMessage("");

    await panelControls.start({
      x: "0%",
      transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
    });

    setIsPanelAnimating(false);
  };

  const googleLogin = useGoogleLogin({
    flow: "auth-code",
    onSuccess: async (codeResponse) => {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const res: AuthApiResponse<LoginGoogleResponse> =
          await authService.loginGoogle(codeResponse.code);
        if (res && res.code === 200) {
          const meResponse = await authService.getCurrentUser();
          if (meResponse && meResponse.result) {
            await handleLoginSuccess(meResponse.result);
          }
        } else {
          setErrorMessage("Không thể đăng nhập bằng Google.");
        }
      } catch (error: unknown) {
        console.error("Google login failed:", error);
        setErrorMessage("Lỗi kết nối tới Google. Vui lòng thử lại.");
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => setErrorMessage("Đăng nhập Google bị hủy hoặc thất bại."),
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        />

        <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-gray-200">
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 z-20 w-8 h-8 bg-black/30 hover:bg-black/40 rounded-full flex items-center justify-center transition-colors"
            aria-label="Đóng"
          >
            <FaTimes className="w-3.5 h-3.5 text-white" />
          </button>

          <div className="relative h-[460px] w-full bg-black">
            <video
              className="absolute inset-0 h-full w-full object-cover"
              src={loginIntroVideo}
              autoPlay
              loop
              muted
              playsInline
            />
            <div className="absolute inset-0 bg-black/40" />

            <div className={`absolute bottom-4 text-white hidden md:block ${isRegisterMode ? "right-4 text-right" : "left-4 text-left"}`}>
              <div className="text-lg font-semibold">EduRoom</div>
              <div className="text-xs text-white/90">
                Tìm phòng nhanh, quản lý dễ dàng.
              </div>
            </div>

            <div
              className={`relative z-10 flex h-full items-stretch ${isRegisterMode ? "justify-start" : "justify-end"}`}
            >
              <motion.div
                animate={panelControls}
                initial={{ x: "0%" }}
                className="w-full max-w-sm h-full bg-transparent backdrop-blur-md rounded-2xl shadow-2xl border-2 border-white flex flex-col overflow-hidden"
              >
                <div className="relative bg-linear-to-br from-[#4da6ff] to-blue-500 px-5 py-3.5 text-white transition-all duration-300">
                  {isForgotPasswordMode && !isRegisterMode && (
                    <button
                      onClick={() => {
                        setIsForgotPasswordMode(false);
                        resetForm();
                      }}
                      className="absolute top-2 left-2 w-6.5 h-6.5 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                      aria-label="Quay lại"
                    >
                      <FaArrowLeft className="w-3 h-3 text-white" />
                    </button>
                  )}

                  <div className="flex justify-center mb-2">
                    <div className="w-10 h-10 border-2 border-white rounded-lg flex items-center justify-center">
                      {isRegisterMode ? (
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
                      ) : isForgotPasswordMode ? (
                        <FaEnvelope className="w-5 h-5" />
                      ) : (
                        <svg
                          width="22"
                          height="22"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                          <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                      )}
                    </div>
                  </div>

                  <h2 className="text-xl font-bold text-center mb-1">
                    {isRegisterMode
                      ? "Tạo Tài Khoản"
                      : isForgotPasswordMode
                        ? "Khôi Phục Mật Khẩu"
                        : "Chào Mừng Trở Lại!"}
                  </h2>
                  <p className="text-center text-white/90 text-xs">
                    {isRegisterMode
                      ? "Đăng ký ngay để bắt đầu"
                      : isForgotPasswordMode
                        ? "Nhập email để nhận hướng dẫn đặt lại mật khẩu"
                        : "Đăng nhập để tiếp tục"}
                  </p>
                </div>

                <div className="px-5 py-3 flex-1 overflow-y-auto text-xs">
                  {errorMessage && (
                    <div className="mb-3 p-2 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg text-center font-medium">
                      {errorMessage}
                    </div>
                  )}
                  {successMessage && (
                    <div className="mb-3 p-2 bg-green-50 border border-green-200 text-green-600 text-xs rounded-lg text-center font-medium">
                      {successMessage}
                    </div>
                  )}

                  {isRegisterMode ? (
                    <form onSubmit={handleRegisterSubmit} className="space-y-2.5">
                      <div className="grid grid-cols-12 gap-2">
                        <div className="col-span-7">
                          <label className="block text-left text-xs font-medium text-white mb-1">
                            Họ và tên
                          </label>
                          <div className="relative">
                            <div className="absolute left-2 top-1/2 -translate-y-1/2">
                              <FaUser className="w-4 h-4 text-white/70" />
                            </div>
                            <input
                              type="text"
                              value={registerFormValues.userName}
                              onChange={handleRegisterChange("userName")}
                              placeholder="Họ tên"
                              className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-100 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4da6ff] focus:border-transparent"
                              disabled={isRegisterLoading}
                              required
                            />
                          </div>
                        </div>

                        <div className="col-span-5">
                          <label className="block text-left text-xs font-medium text-white mb-1">
                            SĐT
                          </label>
                          <input
                            type="tel"
                            value={registerFormValues.phone}
                            onChange={handleRegisterChange("phone")}
                            placeholder="Số điện thoại"
                            className="w-full px-3 py-1.5 text-xs bg-gray-100 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4da6ff] focus:border-transparent"
                            disabled={isRegisterLoading}
                            pattern="^0\\d{9,10}$"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-12 gap-2">
                        <div className="col-span-7">
                          <label className="block text-left text-xs font-medium text-white mb-1">
                            Ngày sinh
                          </label>
                          <input
                            type="date"
                            value={registerFormValues.dateOfBirth}
                            onChange={handleRegisterChange("dateOfBirth")}
                            className="w-full px-3 py-1.5 text-xs bg-gray-100 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#4da6ff] focus:border-transparent"
                            disabled={isRegisterLoading}
                            required
                          />
                        </div>

                        <div className="col-span-5">
                          <label className="block text-left text-xs font-medium text-white mb-1">
                            Giới tính
                          </label>
                          <select
                            value={registerFormValues.gender}
                            onChange={handleRegisterChange("gender")}
                            className="w-full px-3 py-1.5 text-xs bg-gray-100 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#4da6ff] focus:border-transparent"
                            disabled={isRegisterLoading}
                          >
                            <option value="MALE">Nam</option>
                            <option value="FEMALE">Nữ</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-left text-xs font-medium text-white mb-1">
                          Email
                        </label>
                        <div className="relative">
                          <div className="absolute left-2 top-1/2 -translate-y-1/2">
                            <FaEnvelope className="w-4 h-4 text-white/70" />
                          </div>
                          <input
                            type="email"
                            value={registerFormValues.email}
                            onChange={handleRegisterChange("email")}
                            placeholder="email@example.com"
                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-100 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4da6ff] focus:border-transparent"
                            disabled={isRegisterLoading}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-12 gap-2">
                        <div className="col-span-6">
                          <label className="block text-left text-xs font-medium text-white mb-1">
                            Mật khẩu
                          </label>
                          <div className="relative">
                            <div className="absolute left-2 top-1/2 -translate-y-1/2">
                              <FaLock className="w-4 h-4 text-white/70" />
                            </div>
                            <input
                              type="password"
                              value={registerFormValues.password}
                              onChange={handleRegisterChange("password")}
                              placeholder="••••••••"
                              className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-100 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4da6ff] focus:border-transparent"
                              disabled={isRegisterLoading}
                              required
                              minLength={8}
                            />
                          </div>
                        </div>

                        <div className="col-span-6">
                          <label className="block text-left text-xs font-medium text-white mb-1">
                            Nhập lại mật khẩu
                          </label>
                          <div className="relative">
                            <div className="absolute left-2 top-1/2 -translate-y-1/2">
                              <FaLock className="w-4 h-4 text-white/70" />
                            </div>
                            <input
                              type="password"
                              value={registerFormValues.confirmPassword}
                              onChange={handleRegisterChange("confirmPassword")}
                              placeholder="••••••••"
                              className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-100 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4da6ff] focus:border-transparent"
                              disabled={isRegisterLoading}
                              required
                              minLength={8}
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isRegisterLoading}
                        className={`w-full bg-[#4da6ff] hover:bg-[#3d8cff] text-white font-semibold py-1.5 px-4 rounded-lg transition-colors shadow-md hover:shadow-lg text-xs mt-1 ${isRegisterLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                      >
                        {isRegisterLoading ? "Đang xử lý..." : "Tiếp tục"}
                      </button>

                      <div className="mt-2 text-center">
                        <span className="text-xs text-white">
                          Đã có tài khoản?{" "}
                        </span>
                        <button
                          type="button"
                          disabled={isPanelAnimating}
                          onClick={slideToLogin}
                          className="text-xs text-[#4da6ff] hover:text-blue-600 font-semibold focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          Đăng nhập
                        </button>
                      </div>
                    </form>
                  ) : isForgotPasswordMode ? (
                    <form
                      onSubmit={handleForgotPasswordSubmit}
                      className="space-y-4 pt-2 pb-2"
                    >
                      <div>
                        <label className="block text-left text-xs font-medium text-white mb-1">
                          Email đăng ký
                        </label>
                        <div className="relative">
                          <div className="absolute left-2.5 top-1/2 transform -translate-y-1/2">
                            <FaEnvelope className="w-4 h-4 text-white/70" />
                          </div>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Nhập email của bạn..."
                            className="w-full pl-9 pr-3 py-2 text-xs bg-gray-100 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4da6ff] focus:border-transparent"
                            required
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading || !!successMessage}
                        className={`w-full bg-[#4da6ff] hover:bg-[#3d8cff] text-white font-semibold py-2 px-4 rounded-lg transition-colors shadow-md hover:shadow-lg text-xs ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                      >
                        {isLoading ? "Đang gửi..." : "Gửi link xác nhận"}
                      </button>

                      <div className="text-center mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsForgotPasswordMode(false);
                            resetForm();
                          }}
                          className="text-xs text-white/80 hover:text-white font-medium"
                        >
                          Quay lại đăng nhập
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <form onSubmit={handleLoginSubmit} className="space-y-2.5">
                        <div>
                          <label className="block text-left text-xs font-medium text-white mb-1">
                            Email
                          </label>
                          <div className="relative">
                            <div className="absolute left-2.5 top-1/2 transform -translate-y-1/2">
                              <FaEnvelope className="w-4 h-4 text-white/70" />
                            </div>
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="email@example.com"
                              className="w-full pl-9 pr-3 py-2 text-xs bg-gray-100 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4da6ff] focus:border-transparent"
                              required
                              disabled={isLoading}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-left text-xs font-medium text-white mb-1">
                            Mật khẩu
                          </label>
                          <div className="relative">
                            <div className="absolute left-2.5 top-1/2 transform -translate-y-1/2">
                              <FaLock className="w-4 h-4 text-white/70" />
                            </div>
                            <input
                              type={showPassword ? "text" : "password"}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="••••••••"
                              className="w-full pl-9 pr-9 py-2 text-xs bg-gray-100 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4da6ff] focus:border-transparent"
                              required
                              disabled={isLoading}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white focus:outline-none"
                            >
                              {showPassword ? (
                                <FaEyeSlash className="w-4 h-4" />
                              ) : (
                                <FaEye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setErrorMessage("");
                              setSuccessMessage("");
                              setIsForgotPasswordMode(true);
                            }}
                            className="text-xs text-[#4da6ff] hover:text-blue-600 font-medium focus:outline-none"
                          >
                            Quên mật khẩu?
                          </button>
                        </div>

                        <button
                          type="submit"
                          disabled={isLoading}
                          className={`w-full bg-[#4da6ff] hover:bg-[#3d8cff] text-white font-semibold py-2 px-4 rounded-lg transition-colors shadow-md hover:shadow-lg text-xs mt-2 ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                        >
                          {isLoading ? "Đang xử lý..." : "Đăng nhập"}
                        </button>
                      </form>

                      <div className="relative my-2.5">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-white/30"></div>
                        </div>
                        <div className="relative flex justify-center text-xs">
                          <span className="px-2 bg-transparent text-white/80">
                            hoặc
                          </span>
                        </div>
                      </div>

                      <div>
                        <button
                          onClick={() => googleLogin()}
                          disabled={isLoading}
                          type="button"
                          className="w-full flex items-center justify-center gap-2 bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-800 font-medium py-2 px-3 rounded-lg transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg width="17" height="17" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                          </svg>
                          <span>Đăng nhập với Google</span>
                        </button>
                      </div>

                      <div className="mt-2.5 text-center">
                        <span className="text-xs text-white">
                          Chưa có tài khoản?{" "}
                        </span>
                        <button
                          type="button"
                          disabled={isPanelAnimating}
                          onClick={slideToRegister}
                          className="text-xs text-[#4da6ff] hover:text-blue-600 font-semibold focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          Đăng ký ngay
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default LoginPage;
