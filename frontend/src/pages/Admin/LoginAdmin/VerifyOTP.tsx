import React, { useState, useRef } from "react";
import { Modal, Button, Form } from "antd";
import { toast } from "react-toastify";

interface VerifyOTPProps {
  visible: boolean;
  onCancel: () => void;
  onVerify?: (otp: string) => void;
}

const OTP_LENGTH = 6;

const VerifyOTP: React.FC<VerifyOTPProps> = ({
  visible,
  onCancel,
  onVerify,
}) => {
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState<boolean>(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Xử lý nhập từng ô OTP
  const handleChangeOtp = (
    e: React.ChangeEvent<HTMLInputElement>,
    idx: number
  ): void => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    if (!value) return;
    const newOtp = [...otp];
    newOtp[idx] = value[0];
    setOtp(newOtp);
    if (idx < OTP_LENGTH - 1 && value) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  // Xử lý phím Backspace
  const handleKeyDownOtp = (
    e: React.KeyboardEvent<HTMLInputElement>,
    idx: number
  ): void => {
    if (e.key === "Backspace") {
      if (otp[idx]) {
        const newOtp = [...otp];
        newOtp[idx] = "";
        setOtp(newOtp);
      } else if (idx > 0) {
        inputsRef.current[idx - 1]?.focus();
      }
    }
  };

  // Xử lý dán mã OTP
  const handlePasteOtp = (e: React.ClipboardEvent<HTMLDivElement>): void => {
    const paste = e.clipboardData.getData("text").replace(/[^0-9]/g, "");
    if (paste.length === OTP_LENGTH) {
      setOtp(paste.split(""));
      inputsRef.current[OTP_LENGTH - 1]?.focus();
    }
  };

  const handleVerify = async (): Promise<void> => {
    const otpValue = otp.join("");
    if (otpValue.length !== OTP_LENGTH || otp.includes("")) {
      toast.error("Vui lòng nhập đủ mã OTP!");
      return;
    }

    setLoading(true);
    try {
      if (onVerify) {
        await onVerify(otpValue);
      } else {
        // Default behavior if no onVerify callback provided
        toast.error("BE chưa sẵn sàng. Không thể xác thực OTP.");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi xác thực OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      footer={null}
      title="Xác thực OTP"
      destroyOnClose
    >
      <Form layout="vertical" onFinish={handleVerify}>
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
        <Button type="primary" htmlType="submit" loading={loading} block>
          Xác thực OTP
        </Button>
      </Form>
    </Modal>
  );
};

export default VerifyOTP;
