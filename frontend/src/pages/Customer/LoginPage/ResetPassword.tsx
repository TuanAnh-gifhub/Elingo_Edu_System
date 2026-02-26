import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Form, Input, Button, Card, Typography, Alert, message } from "antd";
import authService from "../../../services/auth/authService";
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

  type ResetPasswordFormValues = {
    password: string;
    confirmPassword: string;
  };

  const onFinish = async (values: ResetPasswordFormValues) => {
    setApiError("");
    setSuccessMsg("");
    setIsLoading(true);

    try {
      if (token) {
        await authService.resetPassword({
          token: token,
          newPassword: values.password,
        });

        setSuccessMsg("Đổi mật khẩu thành công! Đang chuyển hướng...");
        message.success("Đổi mật khẩu thành công!");

        setTimeout(() => navigate("/"), 2000);
      }
    } catch (err: unknown) {
      let errorMsg = "Đã có lỗi xảy ra.";

      if (typeof err === "object" && err !== null && "response" in err) {
        type ErrorResponseData = { message?: string } | string;
        const errorWithResponse = err as {
          response?: { data?: ErrorResponseData };
        };
        const data = errorWithResponse.response?.data;

        if (typeof data === "string") {
          errorMsg = data;
        } else if (data && typeof data === "object" && "message" in data) {
          const messageFromData = (data as { message?: string }).message;
          if (messageFromData) {
            errorMsg = messageFromData;
          }
        }
      }

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
          <Title
            level={3}
            style={{ margin: 0, color: "#1F2937", fontWeight: "bold" }}
          >
            Đặt lại mật khẩu
          </Title>
          <Text type="secondary" style={{ fontSize: "14px" }}>
            Nhập mật khẩu mới cho tài khoản của bạn.
          </Text>
        </div>

        {apiError && (
          <Alert
            message={apiError}
            type="error"
            showIcon
            style={{ marginBottom: 15 }}
          />
        )}
        {successMsg && (
          <Alert
            message={successMsg}
            type="success"
            showIcon
            style={{ marginBottom: 15 }}
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
          requiredMark={false} // Tắt dấu sao đỏ mặc định nếu muốn form sạch hơn (tuỳ chọn)
        >
          <Form.Item
            name="password"
            style={{ marginBottom: 12 }} // <--- CHỈNH Ở ĐÂY
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu!" },
              { min: 6, message: "Mật khẩu tối thiểu 6 ký tự." },
            ]}
          >
            <div className="relative group">
              <Input.Password
                placeholder=" "
                style={styles.input}
                className="w-full !rounded-lg !border !border-gray-300 !bg-gray-100 focus-within:!border-blue-600 focus-within:!bg-white focus-within:shadow-[0_0_0_1px_#2563eb] transition-all duration-150"
              />
              <label className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-gray-100 px-1 text-sm text-gray-600 z-10 transition-all duration-150 group-focus-within:top-0 group-focus-within:-translate-y-1/2 group-focus-within:text-[0.65rem] group-focus-within:text-blue-700 group-focus-within:font-semibold group-focus-within:border-t group-focus-within:border-blue-600 group-has-[input:not(:placeholder-shown)]:top-0 group-has-[input:not(:placeholder-shown)]:-translate-y-1/2 group-has-[input:not(:placeholder-shown)]:text-[0.65rem] group-has-[input:not(:placeholder-shown)]:text-blue-700 group-has-[input:not(:placeholder-shown)]:font-semibold">
                Mật khẩu mới
              </label>
            </div>
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={["password"]}
            style={{ marginBottom: 20 }} // <--- CHỈNH Ở ĐÂY
            rules={[
              { required: true, message: "Vui lòng xác nhận mật khẩu!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Mật khẩu không khớp!"));
                },
              }),
            ]}
          >
            <div className="relative group">
              <Input.Password
                placeholder=" "
                style={styles.input}
                className="w-full !rounded-lg !border !border-gray-300 !bg-gray-100 focus-within:!border-blue-600 focus-within:!bg-white focus-within:shadow-[0_0_0_1px_#2563eb] transition-all duration-150"
              />
              <label className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-gray-100 px-1 text-sm text-gray-600 z-10 transition-all duration-150 group-focus-within:top-0 group-focus-within:-translate-y-1/2 group-focus-within:text-[0.65rem] group-focus-within:text-blue-700 group-focus-within:font-semibold group-focus-within:border-t group-focus-within:border-blue-600 group-has-[input:not(:placeholder-shown)]:top-0 group-has-[input:not(:placeholder-shown)]:-translate-y-1/2 group-has-[input:not(:placeholder-shown)]:text-[0.65rem] group-has-[input:not(:placeholder-shown)]:text-blue-700 group-has-[input:not(:placeholder-shown)]:font-semibold">
                Xác nhận mật khẩu
              </label>
            </div>
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
    fontSize: "14px", // Tăng size chữ label
  },
  input: {
    borderRadius: "8px",
    fontSize: "15px", // Tăng chữ trong input
  },
  button: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
    borderRadius: "30px",
    height: "42px", // Giảm chiều cao nút 1 xíu
    fontWeight: 600,
    fontSize: "16px", // Tăng size chữ button
    boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)",
  },
};

export default ResetPassword;
