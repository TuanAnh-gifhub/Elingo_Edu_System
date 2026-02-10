import React, { useEffect } from "react";
import { Form, Input, Modal, Select } from "antd";
import type { CityResponse } from "../../../services/cities/cities";
import type { RentalAreaResponse } from "../../../services/rental-areas/rentalAreas";

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
  initial?: RentalAreaResponse | null;
  onClose: () => void;
  onSubmit: (data: FormValues) => Promise<void>;
};

const UpdateRentalAreaModal: React.FC<Props> = ({
  open,
  loading,
  cities,
  initial,
  onClose,
  onSubmit,
}) => {
  const [form] = Form.useForm<FormValues>();

  useEffect(() => {
    if (open && initial) {
      // NOTE: nếu RentalAreaResponse hiện tại chưa có cityId thì cần bổ sung từ backend
      // Mình xử lý mềm: nếu thiếu cityId thì không set (user sẽ chọn lại)
      form.setFieldsValue({
        rentalAreaName: initial.rentalAreaName,
        address: initial.address,
        contactName: initial.contactName,
        contactPhone: initial.contactPhone,
        cityId: initial.cityId,
      });
    }
    if (open && !initial) form.resetFields();
  }, [open, initial, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await onSubmit(values);
      form.resetFields();
    } catch {
      // ignore validate error
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="Chỉnh sửa tòa nhà"
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="Lưu"
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

        <Form.Item label="Người liên hệ" name="contactName">
          <Input placeholder="Tên người liên hệ" />
        </Form.Item>

        <Form.Item label="SĐT liên hệ" name="contactPhone">
          <Input placeholder="Số điện thoại" />
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
      </Form>
    </Modal>
  );
};

export default UpdateRentalAreaModal;
