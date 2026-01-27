import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { userService } from "../../../services/usersService";

const EyeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const EyeOffIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M1 1l22 22"></path>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"></path>
    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"></path>
  </svg>
);

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const primaryColor = "#2563EB";

  useEffect(() => {
    if (!token) {
      setError("Token không hợp lệ hoặc đường dẫn bị lỗi.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setIsLoading(true);
    try {
      if (token) {
          await userService.resetPassword({
            token: token,
            newPassword: password
          });
          
          setMessage('Đổi mật khẩu thành công!');
          setTimeout(() => navigate('/'), 2000);
      }
    } catch (err: any) {
      setError(
        err.response?.data || "Đã có lỗi xảy ra. Token có thể đã hết hạn.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ... (Phần hiển thị lỗi token giữ nguyên) ...
  if (!token) return <div style={styles.container}>Lỗi Token...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Đặt lại mật khẩu</h2>
        <p style={styles.subtitle}>Nhập mật khẩu mới cho tài khoản của bạn.</p>

        {error && <div style={styles.errorAlert}>{error}</div>}
        {message && <div style={styles.successAlert}>{message}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Input Mật khẩu mới */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Mật khẩu mới</label>
            <div style={styles.passwordWrapper}>
              <input
                type={showPassword ? "text" : "password"} // Đổi type dựa trên state
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                placeholder="••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {/* Input Xác nhận mật khẩu */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Xác nhận mật khẩu</label>
            <div style={styles.passwordWrapper}>
              <input
                type={showConfirmPassword ? "text" : "password"} // Đổi type dựa trên state
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={styles.input}
                placeholder="••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
              >
                {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            style={{
              ...styles.button,
              backgroundColor: isLoading ? "#ccc" : primaryColor,
            }}
            disabled={isLoading}
          >
            {isLoading ? "Đang xử lý..." : "Xác nhận thay đổi"}
          </button>
        </form>
      </div>
    </div>
  );
};

// Cập nhật CSS để thêm vị trí cho nút con mắt
const styles: any = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    backgroundColor: "#F3F4F6",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  card: {
    backgroundColor: "white",
    padding: "40px",
    borderRadius: "16px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
    width: "100%",
    maxWidth: "450px",
    textAlign: "center",
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold",
    marginBottom: "8px",
    color: "#1F2937",
  },
  subtitle: { color: "#6B7280", marginBottom: "30px", fontSize: "14px" },
  form: { display: "flex", flexDirection: "column", gap: "20px" },
  inputGroup: { textAlign: "left" },
  label: {
    display: "block",
    marginBottom: "8px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#374151",
  },

  // --- CSS MỚI CHO PHẦN PASSWORD ---
  passwordWrapper: {
    position: "relative", // Để nút con mắt canh theo khung này
    display: "flex",
    alignItems: "center",
  },
  input: {
    width: "100%",
    padding: "12px 45px 12px 16px", // Padding phải 45px để chữ không đè lên nút mắt
    borderRadius: "8px",
    border: "1px solid #D1D5DB",
    fontSize: "16px",
    outline: "none",
    transition: "border-color 0.2s",
    color: '#1F2937',       // Ép chữ màu xám đậm/đen
    backgroundColor: '#fff' // Ép nền ô nhập màu trắng
  },
  eyeButton: {
    position: "absolute",
    right: "12px", // Canh phải
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#6B7280",
    display: "flex",
    alignItems: "center",
    padding: 0,
    marginTop: 0, // Reset margin cũ
  },
  // ---------------------------------

  button: {
    color: "white",
    padding: "12px",
    borderRadius: "30px",
    fontSize: "16px",
    fontWeight: "600",
    border: "none",
    cursor: "pointer",
    marginTop: "10px",
    transition: "opacity 0.2s",
  },
  errorAlert: {
    backgroundColor: "#FEE2E2",
    color: "#B91C1C",
    padding: "10px",
    borderRadius: "8px",
    fontSize: "14px",
    marginBottom: "15px",
  },
  successAlert: {
    backgroundColor: "#D1FAE5",
    color: "#047857",
    padding: "10px",
    borderRadius: "8px",
    fontSize: "14px",
    marginBottom: "15px",
  },
};

export default ResetPassword;
