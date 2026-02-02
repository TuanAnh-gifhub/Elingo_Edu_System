import React, { useState } from "react";
import {
  Form,
  Input,
  Button,
  DatePicker,
  Select,
  Row,
  Col,
  message,
  ConfigProvider,
  Alert,
} from "antd";
import {
  MailOutlined,
  LockOutlined,
  PhoneOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import locale from "antd/es/date-picker/locale/vi_VN";
import authService, {
  type CreateUsersRequest,
} from "../../../services/auth/authService";

interface RegisterPageProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({
  isOpen,
  onClose,
  onSwitchToLogin,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    setShowSuccess(false);
    try {
      const payload: CreateUsersRequest = {
        userName: values.userName,
        email: values.email,
        password: values.password,
        phone: values.phone,
        gender: values.gender,
        dateOfBirth: values.dateOfBirth.format("YYYY-MM-DD"),
        roleName: "RENTER",
      };

      const response = await authService.registerRequest(payload);

      // Kiểm tra logic response tùy theo API của bạn
      if (response && response.code === 200) {
        setLoading(false);
        setShowSuccess(true);

        // THÊM DÒNG NÀY ĐỂ HIỆN MESSAGE POP-UP
        message.success(response.message || "Đăng ký thành công!");
      } else {
        setLoading(false);
        message.error(
          response?.message || "Đăng ký thất bại. Vui lòng thử lại!",
        );
      }
    } catch (error: any) {
      console.error("Register Error:", error);
      setLoading(false);

      // Lấy message lỗi từ Server trả về
      const errorMsg = error.response?.data?.message || "Lỗi kết nối máy chủ!";
      message.error(errorMsg);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-[720px] bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-gray-200"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-br from-[#4da6ff] to-blue-500 px-6 py-5 text-white">
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-white/70 hover:text-white"
            >
              ✕
            </button>
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
            <p className="text-center text-white/80 text-xs">
              Đăng ký ngay để bắt đầu
            </p>
          </div>

          <div className="px-8 py-6">
            {/* Success Alert */}
            {/* Success Alert - Đã làm nhỏ gọn và thanh thoát */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                  animate={{ height: "auto", opacity: 1, marginBottom: 16 }}
                  exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                  style={{ overflow: "hidden" }}
                >
                  <Alert
                    // Bỏ description, chỉ để lại message cho nhỏ gọn
                    message="Đăng ký thành công! Vui lòng kiểm tra email của bạn."
                    type="success"
                    showIcon
                    // py-1.5 giúp Alert mảnh khảnh như trong ảnh mẫu
                    className="rounded-md border-green-200 bg-green-50 text-[13px] py-1.5 px-3"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <ConfigProvider locale={locale}>
              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                requiredMark={false}
                initialValues={{ gender: "MALE" }}
              >
                <Row gutter={8}>
                  <Col span={7}>
                    <Form.Item
                      label={
                        <span className="text-[12px] font-medium">
                          Họ và tên
                        </span>
                      }
                      name="userName"
                      rules={[{ required: true, message: "Nhập tên" }]}
                      className="mb-2"
                    >
                      <Input
                        prefix={<UserOutlined />}
                        placeholder="Họ tên"
                        className="h-8 text-sm rounded-md"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item
                      label={
                        <span className="text-[12px] font-medium">
                          Ngày sinh
                        </span>
                      }
                      name="dateOfBirth"
                      rules={[{ required: true, message: "Chọn ngày" }]}
                      className="mb-2"
                    >
                      <DatePicker
                        className="w-full h-8 text-sm rounded-md"
                        placeholder="DD/MM/YYYY"
                        format="DD/MM/YYYY"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={5}>
                    <Form.Item
                      label={
                        <span className="text-[12px] font-medium">
                          Giới tính
                        </span>
                      }
                      name="gender"
                      className="mb-2"
                    >
                      <Select className="h-8 text-sm w-full">
                        <Select.Option value="MALE">Nam</Select.Option>
                        <Select.Option value="FEMALE">Nữ</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item
                      label={
                        <span className="text-[12px] font-medium">SĐT</span>
                      }
                      name="phone"
                      rules={[{ pattern: /^0\d{9,10}$/, message: "Sai!" }]}
                      className="mb-2"
                    >
                      <Input
                        prefix={<PhoneOutlined />}
                        placeholder="SĐT"
                        className="h-8 text-sm rounded-md"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={8}>
                  <Col span={8}>
                    <Form.Item
                      label={
                        <span className="text-[12px] font-medium">Email</span>
                      }
                      name="email"
                      rules={[
                        { required: true, type: "email", message: "Sai!" },
                      ]}
                      className="mb-3"
                    >
                      <Input
                        prefix={<MailOutlined />}
                        placeholder="Email"
                        className="h-8 text-sm rounded-md"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      label={
                        <span className="text-[12px] font-medium">
                          Mật khẩu
                        </span>
                      }
                      name="password"
                      rules={[
                        {
                          required: true,
                          min: 8,
                          message: "Tối thiểu 8 ký tự",
                        },
                      ]}
                      className="mb-3"
                    >
                      <Input.Password
                        prefix={<LockOutlined />}
                        placeholder="••••••••"
                        className="h-8 text-sm rounded-md"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      label={
                        <span className="text-[12px] font-medium">
                          Nhập lại mật khẩu
                        </span>
                      }
                      name="confirmPassword"
                      dependencies={["password"]}
                      className="mb-3"
                      rules={[
                        { required: true, message: "Nhập lại mật khẩu!" },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue("password") === value) {
                              return Promise.resolve();
                            }
                            return Promise.reject(
                              new Error("Mật khẩu không khớp!"),
                            );
                          },
                        }),
                      ]}
                    >
                      <Input.Password
                        prefix={<LockOutlined />}
                        placeholder="••••••••"
                        className="h-8 text-sm rounded-md"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={loading}
                  className="h-9 bg-[#4da6ff] hover:bg-[#3d8cff] border-none rounded-lg font-bold text-sm mt-1"
                >
                  {loading ? "Đang xử lý..." : "Tiếp tục"}
                </Button>

                <div className="mt-4 text-center">
                  <span className="text-xs text-gray-500">
                    Đã có tài khoản?{" "}
                  </span>
                  <button
                    type="button"
                    onClick={onSwitchToLogin}
                    className="text-xs text-[#4da6ff] font-bold hover:underline"
                  >
                    Đăng nhập
                  </button>
                </div>
              </Form>
            </ConfigProvider>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default RegisterPage;
