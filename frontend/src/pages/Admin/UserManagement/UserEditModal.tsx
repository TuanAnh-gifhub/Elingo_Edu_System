import React, { useEffect } from "react";
import { Modal, Form, Input, Select, DatePicker } from "antd";
import dayjs from "dayjs";
import type { UserResponse } from "../../../services/usersService";

const { Option } = Select;

interface UserEditModalProps {
  open: boolean;
  user: UserResponse | null;
  loading: boolean;
  onCancel: () => void;
  onSubmit: (values: any) => void;
}

const UserEditModal: React.FC<UserEditModalProps> = ({
  open,
  user,
  loading,
  onCancel,
  onSubmit,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (user && open) {
      form.setFieldsValue({
        userName: user.userName,
        phone: user.phone,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth ? dayjs(user.dateOfBirth) : null,
      });
    } else {
      form.resetFields();
    }
  }, [user, open, form]);

  return (
    <Modal
      title="Chỉnh sửa thông tin người dùng"
      open={open}
      onCancel={onCancel}
      onOk={form.submit}
      okText="Lưu thay đổi"
      cancelText="Hủy"
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item
          name="userName"
          label="Họ và tên"
          rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
        >
          <Input placeholder="Nhập họ và tên" />
        </Form.Item>

        <Form.Item
          name="phone"
          label="Số điện thoại"
          rules={[
            { required: true, message: "Vui lòng nhập SĐT" },
            { pattern: /^[0-9]{10,11}$/, message: "SĐT không hợp lệ" },
          ]}
        >
          <Input placeholder="Nhập số điện thoại" />
        </Form.Item>

        <Form.Item name="gender" label="Giới tính">
          <Select placeholder="Chọn giới tính">
            <Option value="MALE">Nam</Option>
            <Option value="FEMALE">Nữ</Option>
            <Option value="OTHER">Khác</Option>
          </Select>
        </Form.Item>

        <Form.Item name="dateOfBirth" label="Ngày sinh">
          <DatePicker
            style={{ width: "100%" }}
            format="DD/MM/YYYY"
            placeholder="Chọn ngày sinh"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UserEditModal;
