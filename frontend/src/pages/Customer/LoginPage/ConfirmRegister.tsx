import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Result, Button, Spin } from "antd";
import authService from "../../../services/auth/authService";

const ConfirmRegister: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );

  // Flag để chống gọi API 2 lần do StrictMode hoặc Re-render
  const initialized = useRef(false);
  const isCalled = useRef(false);

  useEffect(() => {
    const autoVerify = async () => {
      if (initialized.current) return;

      const email = searchParams.get("email");
      const otp = searchParams.get("otp");

      if (isCalled.current || !email || !otp) return;

      isCalled.current = true;

      initialized.current = true;

      try {
        await authService.registerConfirm(email, otp);
        setStatus("success");
      } catch (error: any) {
        console.error(error);
        setStatus("error");
      }
    };

    autoVerify();
  }, [searchParams]);

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f5f5",
      }}
    >
      {status === "loading" && (
        <div style={{ textAlign: "center" }}>
          <Spin size="large" />
          <p style={{ marginTop: 16 }}>Đang xác thực tài khoản...</p>
        </div>
      )}

      {status === "success" && (
        <Result
          status="success"
          title="Xác thực thành công!"
          subTitle="Tài khoản của bạn đã sẵn sàng. Hãy đăng nhập để bắt đầu."
          extra={[
            <Button type="primary" key="login" onClick={() => navigate("/")}>
              Đăng nhập ngay
            </Button>,
          ]}
        />
      )}

      {status === "error" && (
        <Result
          status="error"
          title="Xác thực thất bại"
          subTitle="Liên kết đã hết hạn hoặc đã được sử dụng. Vui lòng thử lại."
          extra={[
            <Button type="primary" key="home" onClick={() => navigate("/")}>
              Quay lại trang chủ
            </Button>,
          ]}
        />
      )}
    </div>
  );
};

export default ConfirmRegister;
