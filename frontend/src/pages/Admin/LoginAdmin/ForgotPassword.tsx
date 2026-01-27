import React, { useState, useRef } from "react";
import { Modal, Input, Button, Form } from "antd";
import { toast } from "react-toastify";
// Bỏ gọi API forgot/reset admin khi chưa có BE

interface ForgotPasswordProps {
  visible: boolean;
  onCancel: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ visible, onCancel }) => {
  const [step, setStep] = useState<number>(1);
  const [email, setEmail] = useState<string>("");
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleSendOtp = async (): Promise<void> => {
    if (!email) {
      toast.error("Vui lòng nhập email!");
      return;
    }
    setLoading(true);
    // TODO: Gọi API gửi OTP khi có backend
    setTimeout(() => {
      setLoading(false);
      toast.success("OTP đã được gửi đến email của bạn! (Mock)");
      setStep(2);
    }, 1000);
  };

  const handleChangeOtp = (
    e: React.ChangeEvent<HTMLInputElement>,
    idx: number
  ): void => {
    const { value } = e.target;
    if (/^[0-9]$/.test(value) || value === "") {
      const newOtp = [...otp];
      newOtp[idx] = value;
      setOtp(newOtp);

      if (value && idx < 5) {
        inputsRef.current[idx + 1]?.focus();
      }
    }
  };

  const handleKeyDownOtp = (
    e: React.KeyboardEvent<HTMLInputElement>,
    idx: number
  ): void => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
  };

  const handlePasteOtp = (e: React.ClipboardEvent<HTMLDivElement>): void => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("Text").split("");
    const newOtp = [...otp];

    pasteData.forEach((char, idx) => {
      if (idx < 6 && /^[0-9]$/.test(char)) {
        newOtp[idx] = char;
        if (inputsRef.current[idx]) {
          inputsRef.current[idx]!.value = char;
        }
      }
    });

    setOtp(newOtp);
    if (newOtp.every((digit) => digit !== "")) {
      inputsRef.current[5]?.focus();
    }
  };

  const handleResetPassword = async (): Promise<void> => {
    const otpValue = otp.join("");
    if (otpValue.length !== 6 || otp.includes("")) {
      toast.error("Vui lòng nhập đủ mã OTP!");
      return;
    }
    if (!newPassword || !confirmPassword) {
      toast.error("Vui lòng nhập đầy đủ thông tin!");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp!");
      return;
    }
    setLoading(true);
    // TODO: Gọi API reset password khi có backend
    setTimeout(() => {
      setLoading(false);
      toast.success("Đổi mật khẩu thành công! (Mock)");
      // Reset form và đóng modal
      setStep(1);
      setEmail("");
      setOtp(Array(6).fill(""));
      setNewPassword("");
      setConfirmPassword("");
      onCancel();
    }, 1000);
  };

  const handleCancel = (): void => {
    setStep(1);
    setEmail("");
    setOtp(Array(6).fill(""));
    setNewPassword("");
    setConfirmPassword("");
    onCancel();
  };

  return (
    <Modal
      open={visible}
      onCancel={handleCancel}
      footer={null}
      title="Quên mật khẩu"
      destroyOnClose
    >
      {step === 1 && (
        <Form layout="vertical" onFinish={handleSendOtp}>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Vui lòng nhập email!" },
              { type: "email", message: "Email không hợp lệ!" },
            ]}
          >
            <Input
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              placeholder="Nhập email"
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Gửi OTP
          </Button>
        </Form>
      )}
      {step === 2 && (
        <Form layout="vertical" onFinish={handleResetPassword}>
          <label className="ant-form-item-label">Mã OTP</label>
          <div className="flex gap-2 mb-4" onPaste={handlePasteOtp}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el: HTMLInputElement | null) => {
                  inputsRef.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChangeOtp(e, idx)}
                onKeyDown={(e) => handleKeyDownOtp(e, idx)}
                className="w-12 h-12 text-center text-2xl border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                autoFocus={idx === 0}
                disabled={loading}
              />
            ))}
          </div>
          <Form.Item
            label="Mật khẩu mới"
            name="newPassword"
            rules={[{ required: true, message: "Vui lòng nhập mật khẩu mới!" }]}
          >
            <Input.Password
              value={newPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
              placeholder="Nhập mật khẩu mới"
            />
          </Form.Item>
          <Form.Item
            label="Xác nhận mật khẩu"
            name="confirmPassword"
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: "Vui lòng xác nhận mật khẩu!" },
              {
                validator(_: unknown, value: string) {
                  if (!value || value === newPassword) {
                    return Promise.resolve();
                  }
                  return Promise.reject("Mật khẩu xác nhận không khớp!");
                },
              },
            ]}
          >
            <Input.Password
              value={confirmPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Đổi mật khẩu
          </Button>
        </Form>
      )}
    </Modal>
  );
};

export default ForgotPassword;
