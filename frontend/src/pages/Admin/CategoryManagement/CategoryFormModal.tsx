import React, { useEffect } from "react";
import { Form, Input, Modal } from "antd";
import type {
  CategoryResponse,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from "../../../services/categories/categories";

interface CategoryFormModalProps {
  open: boolean;
  loading?: boolean;
  mode: "create" | "edit";
  initialData?: CategoryResponse | null;
  onCancel: () => void;
  onSubmit: (payload: CreateCategoryRequest | UpdateCategoryRequest) => void;
}

const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  open,
  loading = false,
  mode,
  initialData,
  onCancel,
  onSubmit,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && initialData) {
      form.setFieldsValue({
        categoryName: initialData.categoryName,
      });
    } else {
      form.resetFields();
    }
  }, [open, mode, initialData, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    onSubmit({
      categoryName: values.categoryName.trim(),
    });
  };

  return (
    <Modal
      open={open}
      title={mode === "create" ? "Tạo loại phòng" : "Cập nhật loại phòng"}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
      okText={mode === "create" ? "Tạo" : "Cập nhật"}
      cancelText="Hủy"
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Tên loại phòng"
          name="categoryName"
          rules={[
            { required: true, message: "Vui lòng nhập tên loại phòng" },
            { max: 50, message: "Tối đa 50 ký tự" },
          ]}
        >
          <Input placeholder="Ví dụ: Phòng học, Phòng họp, Phòng lab..." />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CategoryFormModal;
