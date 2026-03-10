import { useState } from "react";
import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaTimes,
  FaArrowLeft,
  FaUser,
  FaPhone,
  FaCalendarAlt,
  FaVenusMars,
} from "react-icons/fa";
import { motion, AnimatePresence, useMotionValue, animate } from "framer-motion";
import { message } from "antd";
import { useGoogleLogin } from "@react-oauth/google";
import authService, {
  type ApiResponse as AuthApiResponse,
  type LoginResponse,
  type LoginGoogleResponse,
  type CreateUsersRequest,
} from "../../../services/auth/authService";
import {
  type RegisterFormValues,
  validateRegisterFormValues,
} from "./RegisterPage";
import { useAuth } from "../../../context/AuthContext";
import type { UserResponse } from "../../../services/usersService";
import loginIntroVideo from "../../../assets/login_intro_video.mp4";
interface LoginPageProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginPage = ({ isOpen, onClose }: LoginPageProps) => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] =
    useState(false);
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
    gender: "",
    dateOfBirth: "",
  });
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);
  const panelX = useMotionValue(192); // vị trí mặc định cho màn đăng nhập (lệch sát hơn)
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
      gender: "",
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

  const validateRegisterForm = (): string | null =>
    validateRegisterFormValues(registerFormValues as RegisterFormValues);

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

  const animatePanelToMode = async (mode: "login" | "register") => {
    if (isPanelAnimating) return;
    setIsPanelAnimating(true);

    // Đổi nội dung (login/register) NGAY TRƯỚC khi animate
    // để header + form bên trong trông "đi cùng" với chuyển động của thẻ
    setIsRegisterMode(mode === "register");

    const targetX = mode === "login" ? 192 : -192;

    await animate(panelX, targetX, {
      type: "spring",
      stiffness: 280,
      damping: 30,
    }).finished;

    setIsPanelAnimating(false);
  };

  const slideToRegister = async () => {
    if (isRegisterMode) return;
    setIsForgotPasswordMode(false);
    setErrorMessage("");
    setSuccessMessage("");
    await animatePanelToMode("register");
  };

  const slideToLogin = async () => {
    if (!isRegisterMode) return;
    setErrorMessage("");
    setSuccessMessage("");
    await animatePanelToMode("login");
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
              <div className="text-lg font-semibold">Elingo</div>
              <div className="text-sm text-white/90">
                Tìm phòng nhanh, quản lý dễ dàng.
              </div>
            </div>

            <div className="relative z-10 flex h-full items-center justify-center">
              <motion.div
                style={{ x: panelX }}
                drag="x"
                dragConstraints={{ left: -140, right: 140 }}
                dragElastic={0.18}
                onDragEnd={(_, info) => {
                  const deltaX = info.offset.x;
                  const threshold = 60;

                  if (isForgotPasswordMode) {
                    // Ở màn quên mật khẩu thì chỉ snap về mode hiện tại
                    void animatePanelToMode(isRegisterMode ? "register" : "login");
                    return;
                  }

                  if (deltaX < -threshold) {
                    // Kéo sang trái -> đăng ký
                    setIsForgotPasswordMode(false);
                    setErrorMessage("");
                    setSuccessMessage("");
                    void animatePanelToMode("register");
                  } else if (deltaX > threshold) {
                    // Kéo sang phải -> đăng nhập
                    setIsForgotPasswordMode(false);
                    setErrorMessage("");
                    setSuccessMessage("");
                    void animatePanelToMode("login");
                  } else {
                    // Không đủ ngưỡng, trả về mode hiện tại
                    void animatePanelToMode(isRegisterMode ? "register" : "login");
                  }
                }}
                className="w-full max-w-sm h-full bg-transparent backdrop-blur-md rounded-2xl shadow-2xl border-2 border-white flex flex-col overflow-hidden overflow-x-hidden"
              >
                <div className={`relative bg-linear-to-br from-[#4da6ff] to-blue-500 px-5 text-white transition-all duration-200 ease-in-out ${errorMessage || successMessage ? 'py-1' : 'py-3.5'}`}>
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

                  <div className={`flex justify-center transition-all duration-200 ease-in-out ${errorMessage || successMessage ? 'mb-0.5' : 'mb-2'}`}>
                    <div className={`border-2 border-white rounded-lg flex items-center justify-center transition-all duration-200 ease-in-out ${errorMessage || successMessage ? 'w-8 h-8' : 'w-10 h-10'}`}>
                      {isRegisterMode ? (
                        <svg
                          width={errorMessage || successMessage ? "18" : "22"}
                          height={errorMessage || successMessage ? "18" : "22"}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                          <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                      ) : isForgotPasswordMode ? (
                        <FaEnvelope className={errorMessage || successMessage ? "w-4 h-4" : "w-5 h-5"} />
                      ) : (
                        <svg
                          width={errorMessage || successMessage ? "18" : "22"}
                          height={errorMessage || successMessage ? "18" : "22"}
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

                  <h2 className={`${errorMessage || successMessage ? 'text-lg' : 'text-xl'} font-bold text-center transition-all duration-200 ease-in-out ${errorMessage || successMessage ? 'mb-0.5' : 'mb-1'}`}>
                    {isRegisterMode
                      ? "Tạo Tài Khoản"
                      : isForgotPasswordMode
                        ? "Khôi Phục Mật Khẩu"
                        : "Chào Mừng Trở Lại!"}
                  </h2>
                  <p className={`text-center text-white/90 transition-all duration-200 ease-in-out ${errorMessage || successMessage ? 'text-xs' : 'text-sm'}`}>
                    {isRegisterMode
                      ? "Đăng ký ngay để bắt đầu"
                      : isForgotPasswordMode
                        ? "Nhập email để nhận hướng dẫn đặt lại mật khẩu"
                        : "Đăng nhập để tiếp tục"}
                  </p>
                </div>

                <div className="px-5 py-2 min-h-0 flex-1 overflow-y-auto text-sm">
                  <div
                    className={`flex items-start transition-all duration-150 ${
                      errorMessage || successMessage
                        ? "min-h-[40px] mb-2"
                        : "min-h-[8px] mb-1"
                    }`}
                  >
                    <AnimatePresence mode="wait">
                      {errorMessage && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.96 }}
                          transition={{ duration: 0.2, delay: 0.12, ease: [0.4, 0, 0.2, 1] }}
                          className="w-full px-2 py-1 bg-red-50 border border-red-200 text-red-600 text-xs leading-snug rounded-md text-center font-semibold"
                        >
                          {errorMessage}
                        </motion.div>
                      )}
                      {successMessage && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.96 }}
                          transition={{ duration: 0.2, delay: 0.12, ease: [0.4, 0, 0.2, 1] }}
                          className="w-full px-2 py-1 bg-green-50 border border-green-200 text-green-600 text-xs leading-snug rounded-md text-center font-semibold"
                        >
                          {successMessage}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {isRegisterMode ? (
                    <form onSubmit={handleRegisterSubmit} className="space-y-2.5">
                      <div className="grid grid-cols-12 gap-2">
                        <div className="col-span-7">
                          <div className="relative">
                            <div className="absolute left-2 top-1/2 -translate-y-1/2">
                              <FaUser className="w-4 h-4 text-blue-600/70" />
                            </div>
                            <input
                              type="text"
                              value={registerFormValues.userName}
                              onChange={handleRegisterChange("userName")}
                              placeholder=" "
                              className="peer w-full rounded-lg border-2 border-gray-300 bg-white text-gray-900 text-sm pl-8 pr-3 py-2.5 transition-all duration-150 focus:outline-none focus:border-blue-600 focus:bg-white"
                              disabled={isRegisterLoading}
                              required
                            />
                            <label className="pointer-events-none absolute left-8 top-1/2 -translate-y-1/2 rounded-full bg-white px-1 text-sm text-gray-600 border-2 border-transparent z-10 transition-all duration-150 peer-focus:bg-white peer-not-placeholder-shown:bg-white peer-focus:border-blue-600 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-[0.65rem] peer-focus:text-blue-700 peer-focus:font-semibold peer-not-placeholder-shown:top-0 peer-not-placeholder-shown:-translate-y-1/2 peer-not-placeholder-shown:text-[0.65rem] peer-not-placeholder-shown:text-blue-700 peer-not-placeholder-shown:font-semibold">
                              Họ và tên
                            </label>
                          </div>
                        </div>

                        <div className="col-span-5">
                          <div className="relative">
                            <div className="absolute left-2 top-1/2 -translate-y-1/2">
                              <FaPhone className="w-4 h-4 text-blue-600/70" />
                            </div>
                            <input
                              type="tel"
                              value={registerFormValues.phone}
                              onChange={handleRegisterChange("phone")}
                              placeholder=" "
                              className="peer w-full rounded-lg border-2 border-gray-300 bg-white text-gray-900 text-sm pl-8 pr-3 py-2.5 transition-all duration-150 focus:outline-none focus:border-blue-600 focus:bg-white"
                              disabled={isRegisterLoading}
                              pattern="^0\d{9,10}$"
                            />
                            <label className="pointer-events-none absolute left-8 top-1/2 -translate-y-1/2 rounded-full bg-white px-1 text-sm text-gray-600 border-2 border-transparent z-10 transition-all duration-150 peer-focus:bg-white peer-not-placeholder-shown:bg-white peer-focus:border-blue-600 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-[0.65rem] peer-focus:text-blue-700 peer-focus:font-semibold peer-not-placeholder-shown:top-0 peer-not-placeholder-shown:-translate-y-1/2 peer-not-placeholder-shown:text-[0.65rem] peer-not-placeholder-shown:text-blue-700 peer-not-placeholder-shown:font-semibold">
                              SĐT
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-12 gap-2">
                        <div className="col-span-7">
                          <div className="relative">
                            <div className="absolute left-2 top-1/2 -translate-y-1/2">
                              <FaCalendarAlt className="w-4 h-4 text-blue-600/70" />
                            </div>
                            <input
                              type="date"
                              value={registerFormValues.dateOfBirth}
                              onChange={handleRegisterChange("dateOfBirth")}
                              className="peer date-input w-full rounded-lg border-2 border-gray-300 bg-white text-gray-900 text-sm pl-8 pr-3 py-2.5 transition-all duration-150 focus:outline-none focus:border-blue-600 focus:bg-white"
                              disabled={isRegisterLoading}
                              required
                            />
                            <label
                              className={`pointer-events-none absolute left-8 rounded-full bg-white px-1 border-2 border-transparent z-10 transition-all duration-150 peer-focus:bg-white peer-focus:border-blue-600 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-[0.65rem] peer-focus:text-blue-700 peer-focus:font-semibold ${
                                registerFormValues.dateOfBirth
                                  ? "top-0 -translate-y-1/2 text-[0.65rem] text-blue-700 font-semibold border-blue-600"
                                  : "top-1/2 -translate-y-1/2 text-sm text-gray-700"
                              }`}
                            >
                              Ngày sinh
                            </label>
                          </div>
                        </div>

                        <div className="col-span-5">
                          <div className="relative">
                            <div className="absolute left-2 top-1/2 -translate-y-1/2">
                              <FaVenusMars className="w-4 h-4 text-blue-600/70" />
                            </div>
                            <select
                              value={registerFormValues.gender}
                              onChange={handleRegisterChange("gender")}
                              className="peer w-full rounded-lg border-2 border-gray-300 bg-white text-gray-900 text-sm pl-8 pr-3 py-2.5 transition-all duration-150 focus:outline-none focus:border-blue-600 focus:bg-white"
                              disabled={isRegisterLoading}
                            >
                              {/* option rỗng giữ value="" nhưng ẩn trong dropdown để không tạo khoảng trắng */}
                              <option value="" disabled hidden>
                                {""}
                              </option>
                              <option value="MALE">Nam</option>
                              <option value="FEMALE">Nữ</option>
                            </select>
                            <label
                              className={`pointer-events-none absolute left-8 rounded-full bg-white px-1 border-2 border-transparent z-10 transition-all duration-150 peer-focus:bg-white peer-focus:border-blue-600 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-[0.65rem] peer-focus:text-blue-700 peer-focus:font-semibold ${
                                registerFormValues.gender
                                  ? "top-0 -translate-y-1/2 text-[0.65rem] text-blue-700 font-semibold border-blue-600"
                                  : "top-1/2 -translate-y-1/2 text-sm text-gray-700"
                              }`}
                            >
                              Giới tính
                            </label>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="relative">
                          <div className="absolute left-2 top-1/2 -translate-y-1/2">
                            <FaEnvelope className="w-4 h-4 text-blue-600/70" />
                          </div>
                          <input
                            type="email"
                            value={registerFormValues.email}
                            onChange={handleRegisterChange("email")}
                            placeholder=" "
                              className="peer w-full rounded-lg border-2 border-gray-300 bg-white text-gray-900 text-sm pl-8 pr-3 py-2.5 transition-all duration-150 focus:outline-none focus:border-blue-600 focus:bg-white"
                            disabled={isRegisterLoading}
                            required
                          />
                          <label className="pointer-events-none absolute left-8 top-1/2 -translate-y-1/2 rounded-full bg-white px-1 text-sm text-gray-600 border-2 border-transparent z-10 transition-all duration-150 peer-focus:bg-white peer-not-placeholder-shown:bg-white peer-focus:border-blue-600 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-[0.65rem] peer-focus:text-blue-700 peer-focus:font-semibold peer-not-placeholder-shown:top-0 peer-not-placeholder-shown:-translate-y-1/2 peer-not-placeholder-shown:text-[0.65rem] peer-not-placeholder-shown:text-blue-700 peer-not-placeholder-shown:font-semibold">
                            Email
                          </label>
                        </div>
                      </div>

                      <div className="grid grid-cols-12 gap-2">
                        <div className="col-span-6">
                          <div className="relative">
                            <div className="absolute left-2 top-1/2 -translate-y-1/2">
                              <FaLock className="w-4 h-4 text-blue-600/70" />
                            </div>
                            <input
                              type={showRegisterPassword ? "text" : "password"}
                              value={registerFormValues.password}
                              onChange={handleRegisterChange("password")}
                              placeholder=" "
                              className="peer w-full rounded-lg border-2 border-gray-300 bg-white text-gray-900 text-sm pl-8 pr-9 py-2.5 transition-all duration-150 focus:outline-none focus:border-blue-600 focus:bg-white"
                              disabled={isRegisterLoading}
                              required
                              minLength={8}
                            />
                            <label className="pointer-events-none absolute left-8 top-1/2 -translate-y-1/2 rounded-full bg-white px-1 text-sm text-gray-600 border-2 border-transparent z-10 transition-all duration-150 peer-focus:bg-white peer-not-placeholder-shown:bg-white peer-focus:border-blue-600 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-[0.65rem] peer-focus:text-blue-700 peer-focus:font-semibold peer-not-placeholder-shown:top-0 peer-not-placeholder-shown:-translate-y-1/2 peer-not-placeholder-shown:text-[0.65rem] peer-not-placeholder-shown:text-blue-700 peer-not-placeholder-shown:font-semibold">
                              Mật khẩu
                            </label>
                            <button
                              type="button"
                              onClick={() =>
                                setShowRegisterPassword(!showRegisterPassword)
                              }
                              className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-blue-600/80 hover:text-blue-700 focus:outline-none"
                            >
                              {showRegisterPassword ? (
                                <FaEyeSlash className="w-4 h-4" />
                              ) : (
                                <FaEye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="col-span-6">
                          <div className="relative">
                            <div className="absolute left-2 top-1/2 -translate-y-1/2">
                              <FaLock className="w-4 h-4 text-blue-600/70" />
                            </div>
                            <input
                              type={
                                showRegisterConfirmPassword ? "text" : "password"
                              }
                              value={registerFormValues.confirmPassword}
                              onChange={handleRegisterChange("confirmPassword")}
                              placeholder=" "
                              className="peer w-full rounded-lg border-2 border-gray-300 bg-white text-gray-900 text-sm pl-8 pr-9 py-2.5 transition-all duration-150 focus:outline-none focus:border-blue-600 focus:bg-white"
                              disabled={isRegisterLoading}
                              required
                              minLength={8}
                            />
                            <label className="pointer-events-none absolute left-8 top-1/2 -translate-y-1/2 rounded-full bg-white px-1 text-sm text-gray-600 border-2 border-transparent z-10 transition-all duration-150 peer-focus:bg-white peer-not-placeholder-shown:bg-white peer-focus:border-blue-600 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-[0.65rem] peer-focus:text-blue-700 peer-focus:font-semibold peer-not-placeholder-shown:top-0 peer-not-placeholder-shown:-translate-y-1/2 peer-not-placeholder-shown:text-[0.65rem] peer-not-placeholder-shown:text-blue-700 peer-not-placeholder-shown:font-semibold">
                              Nhập lại mật khẩu
                            </label>
                            <button
                              type="button"
                              onClick={() =>
                                setShowRegisterConfirmPassword(
                                  !showRegisterConfirmPassword,
                                )
                              }
                              className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-blue-600/80 hover:text-blue-700 focus:outline-none"
                            >
                              {showRegisterConfirmPassword ? (
                                <FaEyeSlash className="w-4 h-4" />
                              ) : (
                                <FaEye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isRegisterLoading}
                        className={`w-full bg-[#4da6ff] hover:bg-[#3d8cff] text-white font-semibold py-1.5 px-4 rounded-lg transition-colors shadow-md hover:shadow-lg text-sm mt-1 ${isRegisterLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                      >
                        {isRegisterLoading ? "Đang xử lý..." : "Tiếp tục"}
                      </button>

                      <div className="mt-2 text-center">
                        <span className="text-sm text-white">
                          Đã có tài khoản?{" "}
                        </span>
                        <button
                          type="button"
                          disabled={isPanelAnimating}
                          onClick={slideToLogin}
                          className="text-sm text-[#4da6ff] hover:text-blue-600 font-semibold focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
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
                        <div className="relative">
                          <div className="absolute left-2.5 top-1/2 transform -translate-y-1/2">
                            <FaEnvelope className="w-4 h-4 text-white/70" />
                          </div>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder=" "
                            className="peer w-full rounded-lg border-2 border-gray-300 bg-white text-gray-900 text-sm pl-9 pr-3 py-2.5 transition-all duration-150 focus:outline-none focus:border-blue-600 focus:bg-white"
                            required
                            disabled={isLoading}
                          />
                          <label className="pointer-events-none absolute left-9 top-1/2 -translate-y-1/2 rounded-full bg-white px-1 text-sm text-gray-600 border-2 border-transparent z-10 transition-all duration-150 peer-focus:bg-white peer-not-placeholder-shown:bg-white peer-focus:border-blue-600 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-[0.65rem] peer-focus:text-blue-700 peer-focus:font-semibold peer-not-placeholder-shown:top-0 peer-not-placeholder-shown:-translate-y-1/2 peer-not-placeholder-shown:text-[0.65rem] peer-not-placeholder-shown:text-blue-700 peer-not-placeholder-shown:font-semibold">
                            Email đăng ký
                          </label>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading || !!successMessage}
                        className={`w-full bg-[#4da6ff] hover:bg-[#3d8cff] text-white font-semibold py-2 px-4 rounded-lg transition-colors shadow-md hover:shadow-lg text-sm ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
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
                          className="text-sm text-white/80 hover:text-white font-medium"
                        >
                          Quay lại đăng nhập
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <form onSubmit={handleLoginSubmit} className="space-y-3">
                        <div>
                          <div className="relative">
                            <div className="absolute left-2.5 top-1/2 transform -translate-y-1/2">
                              <FaEnvelope className="w-4 h-4 text-blue-600/70" />
                            </div>
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder=" "
                              className="peer w-full rounded-lg border-2 border-gray-300 bg-white text-gray-900 text-sm pl-9 pr-3 py-2.5 transition-all duration-150 focus:outline-none focus:border-blue-600 focus:bg-white"
                              required
                              disabled={isLoading}
                            />
                            <label className="pointer-events-none absolute left-9 top-1/2 -translate-y-1/2 rounded-full bg-white px-1 text-sm text-gray-600 border-2 border-transparent z-10 transition-all duration-150 peer-focus:bg-white peer-not-placeholder-shown:bg-white peer-focus:border-blue-600 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-[0.65rem] peer-focus:text-blue-700 peer-focus:font-semibold peer-not-placeholder-shown:top-0 peer-not-placeholder-shown:-translate-y-1/2 peer-not-placeholder-shown:text-[0.65rem] peer-not-placeholder-shown:text-blue-700 peer-not-placeholder-shown:font-semibold">
                              Email
                            </label>
                          </div>
                        </div>

                        <div>
                          <div className="relative">
                            <div className="absolute left-2.5 top-1/2 transform -translate-y-1/2">
                              <FaLock className="w-4 h-4 text-blue-600/70" />
                            </div>
                            <input
                              type={showPassword ? "text" : "password"}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder=" "
                              className="peer w-full rounded-lg border-2 border-gray-300 bg-white text-gray-900 text-sm pl-9 pr-9 py-2.5 transition-all duration-150 focus:outline-none focus:border-blue-600 focus:bg-white"
                              required
                              disabled={isLoading}
                            />
                            <label className="pointer-events-none absolute left-9 top-1/2 -translate-y-1/2 rounded-full bg-white px-1 text-sm text-gray-600 border-2 border-transparent z-10 transition-all duration-150 peer-focus:bg-white peer-not-placeholder-shown:bg-white peer-focus:border-blue-600 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-[0.65rem] peer-focus:text-blue-700 peer-focus:font-semibold peer-not-placeholder-shown:top-0 peer-not-placeholder-shown:-translate-y-1/2 peer-not-placeholder-shown:text-[0.65rem] peer-not-placeholder-shown:text-blue-700 peer-not-placeholder-shown:font-semibold">
                              Mật khẩu
                            </label>
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-blue-600/80 hover:text-blue-700 focus:outline-none"
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
                            className="text-sm text-[#4da6ff] hover:text-blue-600 font-medium focus:outline-none"
                          >
                            Quên mật khẩu?
                          </button>
                        </div>

                        <button
                          type="submit"
                          disabled={isLoading}
                          className={`w-full bg-[#4da6ff] hover:bg-[#3d8cff] text-white font-semibold py-2 px-4 rounded-lg transition-colors shadow-md hover:shadow-lg text-sm mt-2 ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                        >
                          {isLoading ? "Đang xử lý..." : "Đăng nhập"}
                        </button>
                      </form>

                      <div className="relative my-2.5">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-white/30"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
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
                          className="w-full flex items-center justify-center gap-2 bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-800 font-medium py-1.5 px-3 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
                        <span className="text-sm text-white">
                          Chưa có tài khoản?{" "}
                        </span>
                        <button
                          type="button"
                          disabled={isPanelAnimating}
                          onClick={slideToRegister}
                          className="text-sm text-[#4da6ff] hover:text-blue-600 font-semibold focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
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

