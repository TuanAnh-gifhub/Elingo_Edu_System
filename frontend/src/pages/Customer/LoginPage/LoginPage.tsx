import { useState } from "react";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaTimes } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

interface LoginPageProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
}

const LoginPage = ({ isOpen, onClose, onSwitchToRegister }: LoginPageProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle login logic here
    console.log("Login:", { email, password });
  };

  const handleGoogleLogin = () => {
    // Handle Google login
    console.log("Google login");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* Backdrop */}
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
          className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-gray-200"
        >
          {/* Blue Header */}
          <div className="relative bg-gradient-to-br from-[#4da6ff] to-blue-500 px-5 py-3.5 text-white">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-2 right-2 w-6.5 h-6.5 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
            >
              <FaTimes className="w-3 h-3 text-white" />
            </button>

            {/* House icon */}
            <div className="flex justify-center mb-2">
              <div className="w-10 h-10 border-2 border-white rounded-lg flex items-center justify-center">
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
              </div>
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-center mb-1">Chào Mừng Trở Lại!</h2>
            <p className="text-center text-white/90 text-xs">Đăng nhập để tiếp tục</p>
          </div>

          {/* White Form Section */}
          <div className="px-5 py-3">
            <form onSubmit={handleSubmit} className="space-y-2.5">
              {/* Email Input */}
              <div>
                <label className="block text-left text-xs font-medium text-gray-800 mb-1">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute left-2.5 top-1/2 transform -translate-y-1/2">
                    <FaEnvelope className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-gray-100 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4da6ff] focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-left text-xs font-medium text-gray-800 mb-1">
                  Mật khẩu
                </label>
                <div className="relative">
                  <div className="absolute left-2.5 top-1/2 transform -translate-y-1/2">
                    <FaLock className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-9 py-2 text-xs bg-gray-100 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4da6ff] focus:border-transparent"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <FaEyeSlash className="w-4 h-4" />
                    ) : (
                      <FaEye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot Password */}
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  className="text-xs text-[#4da6ff] hover:text-blue-600 font-medium"
                >
                  Quên mật khẩu?
                </button>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                className="w-full bg-[#4da6ff] hover:bg-[#3d8cff] text-white font-semibold py-2 px-4 rounded-lg transition-colors shadow-md hover:shadow-lg text-xs mt-2"
              >
                Đăng nhập
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-2.5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-gray-600">hoặc</span>
              </div>
            </div>

            {/* Social Login Buttons */}
            <div>
              {/* Google Login */}
              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-2 bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-800 font-medium py-2 px-3 rounded-lg transition-colors text-xs"
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

            {/* Signup Link */}
            <div className="mt-2.5 text-center">
              <span className="text-xs text-gray-700">Chưa có tài khoản? </span>
              <button
                onClick={onSwitchToRegister}
                className="text-xs text-[#4da6ff] hover:text-blue-600 font-semibold"
              >
                Đăng ký ngay
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default LoginPage;
