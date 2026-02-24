import React, { useMemo, useState } from "react";
import { Button, Form, Input, Modal, Upload, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import type { CityResponse } from "../../../services/cities/cities";
import { Select } from "antd";
const { Option } = Select;

type FormValues = {
  rentalAreaName: string;
  address: string;
  contactName?: string;
  contactPhone?: string;
  cityId: number;
};

type Props = {
  open: boolean;
  loading: boolean;
  cities: CityResponse[];
  onClose: () => void;
  onSubmit: (data: FormValues & { images: File[] }) => Promise<void>;
};

const CreateRentalAreaModal: React.FC<Props> = ({
  open,
  loading,
  cities,
  onClose,
  onSubmit,
}) => {
  const [form] = Form.useForm<FormValues>();
  const [files, setFiles] = useState<File[]>([]);

  const uploadProps = useMemo(
    () => ({
      multiple: true,
      beforeUpload: (file: File) => {
        // chặn auto upload, mình tự submit bằng form
        setFiles((prev) => {
          const next = [...prev, file].slice(0, 5);
          return next;
        });
        return false;
      },
      onRemove: (file: any) => {
        setFiles((prev) => prev.filter((f) => f.name !== file.name));
      },
      fileList: files.map((f) => ({
        uid: `${f.name}-${f.size}-${f.lastModified}`,
        name: f.name,
      })),
    }),
    [files],
  );

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (files.length < 1 || files.length > 5) {
        message.error("Vui lòng chọn từ 1 đến 5 ảnh");
        return;
      }
      await onSubmit({ ...values, images: files });
      form.resetFields();
      setFiles([]);
    } catch {
      // validate error: ignore
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setFiles([]);
    onClose();
  };

  return (
    <Modal
      title="Thêm tòa nhà"
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="Tạo"
      cancelText="Hủy"
      confirmLoading={loading}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Tên tòa nhà"
          name="rentalAreaName"
          rules={[{ required: true, message: "Vui lòng nhập tên tòa nhà" }]}
        >
          <Input placeholder="Ví dụ: EduRoom Building A" />
        </Form.Item>

        <Form.Item
          label="Địa chỉ"
          name="address"
          rules={[{ required: true, message: "Vui lòng nhập địa chỉ" }]}
        >
          <Input placeholder="Ví dụ: 123 Đường ABC, Quận 1, TP.HCM" />
        </Form.Item>

        <Form.Item
          label="Người liên hệ"
          name="contactName"
          rules={[
            { required: true, message: "Vui lòng nhập tên người liên hệ" },
            { whitespace: true, message: "Tên liên hệ không được để trống" },
          ]}
        >
          <Input placeholder="Nhập tên của bạn" />
        </Form.Item>

        <Form.Item
          label="SĐT liên hệ"
          name="contactPhone"
          rules={[
            { required: true, message: "Vui lòng nhập số điện thoại" },
            {
              pattern: /^(0|\+84)[0-9]{8,10}$/,
              message: "Số điện thoại không hợp lệ",
            },
          ]}
        >
          <Input placeholder="Nhập số điện thoại của bạn" />
        </Form.Item>

        <Form.Item
          label="Thành phố"
          name="cityId"
          rules={[{ required: true, message: "Vui lòng chọn thành phố" }]}
        >
          <Select placeholder="Chọn thành phố">
            {cities.map((c) => (
              <Option key={c.cityId} value={c.cityId}>
                {c.cityName}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="Ảnh tòa nhà (1-5 ảnh)">
          <Upload {...(uploadProps as any)}>
            <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
          </Upload>

          <div className="text-xs text-gray-500 mt-2">
            Ảnh đầu tiên sẽ được dùng làm ảnh cover.
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateRentalAreaModal;
