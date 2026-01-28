import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Form, Input, Button, Card, Typography, Alert, message } from "antd";
import { userService } from "../../../services/usersService";

const { Title, Text } = Typography;

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [form] = Form.useForm();

  useEffect(() => {
    if (!token) {
      setApiError("Đường dẫn không hợp lệ hoặc thiếu Token xác thực.");
    }
  }, [token]);

  const onFinish = async (values: any) => {
    setApiError("");
    setSuccessMsg("");
    setIsLoading(true);

    try {
      if (token) {
        await userService.resetPassword({
          token: token,
          newPassword: values.password,
        });

        setSuccessMsg("Đổi mật khẩu thành công! Đang chuyển hướng...");
        message.success("Đổi mật khẩu thành công!");
        
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.response?.data || "Đã có lỗi xảy ra.";
      setApiError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div style={styles.container}>
        <Card style={styles.card}>
          <Alert
            message="Lỗi Đường Dẫn"
            description="Token không hợp lệ. Vui lòng kiểm tra lại email."
            type="error"
            showIcon
          />
        </Card>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Card style={styles.card} bordered={false}>
        {/* Header - Giảm margin bottom từ 30 xuống 20 */}
        <div style={{ marginBottom: 20 }}> 
          <Title level={3} style={{ margin: 0, color: "#1F2937", fontWeight: "bold" }}>
            Đặt lại mật khẩu
          </Title>
          <Text type="secondary" style={{ fontSize: '13px' }}>Nhập mật khẩu mới cho tài khoản của bạn.</Text>
        </div>

        {apiError && (
          <Alert message={apiError} type="error" showIcon style={{ marginBottom: 15 }} />
        )}
        {successMsg && (
          <Alert message={successMsg} type="success" showIcon style={{ marginBottom: 15 }} />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
          requiredMark={false} // Tắt dấu sao đỏ mặc định nếu muốn form sạch hơn (tuỳ chọn)
        >
          {/* Mật khẩu mới - Giảm khoảng cách xuống 12px */}
          <Form.Item
            label={<span style={styles.label}>Mật khẩu mới</span>}
            name="password"
            style={{ marginBottom: 12 }} // <--- CHỈNH Ở ĐÂY
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu!" },
              { min: 6, message: "Mật khẩu tối thiểu 6 ký tự." },
            ]}
          >
            <Input.Password placeholder="••••••" style={styles.input} />
          </Form.Item>

          {/* Xác nhận mật khẩu - Giảm khoảng cách xuống 15px (để cách nút một chút) */}
          <Form.Item
            label={<span style={styles.label}>Xác nhận mật khẩu</span>}
            name="confirmPassword"
            dependencies={['password']}
            style={{ marginBottom: 20 }} // <--- CHỈNH Ở ĐÂY
            rules={[
              { required: true, message: "Vui lòng xác nhận mật khẩu!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu không khớp!'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="••••••" style={styles.input} />
          </Form.Item>

          {/* Nút Submit */}
          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={isLoading}
              style={styles.button}
            >
              Xác nhận thay đổi
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    paddingTop: "60px",
    minHeight: "100vh",
    backgroundColor: "#F3F4F6",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    paddingBottom: "20px",
  },
  card: {
    width: "100%",
    maxWidth: "420px", // Giảm chiều rộng card một chút cho gọn
    borderRadius: "16px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
    textAlign: "center" as const,
    padding: "10px 10px", // Giảm padding dọc của card
  },
  label: {
    fontWeight: 600,
    color: "#374151",
    fontSize: "13px", // Giảm size chữ label 1 chút cho tinh tế
  },
  input: {
    borderRadius: "8px",
    fontSize: "14px", // Chữ trong input vừa phải
  },
  button: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
    borderRadius: "30px",
    height: "42px", // Giảm chiều cao nút 1 xíu
    fontWeight: 600,
    fontSize: "15px",
    boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)",
  },
};

export default ResetPassword;