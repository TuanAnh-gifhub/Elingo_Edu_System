import React, { useEffect } from "react";
import { Form, Input, Modal, Select } from "antd";
import type {
  AmenityResponse,
  CreateAmenityRequest,
  UpdateAmenityRequest,
} from "../../../services/amenities/amenities";
import {
  AMENITY_ICON_MAP,
  AMENITY_ICON_OPTIONS,
  type AmenityIconKey,
} from "./amenityIcons";

interface AmenityFormModalProps {
  open: boolean;
  loading?: boolean;
  mode: "create" | "edit";
  initialData?: AmenityResponse | null;
  onCancel: () => void;
  onSubmit: (payload: CreateAmenityRequest | UpdateAmenityRequest) => void;
}

const AmenityFormModal: React.FC<AmenityFormModalProps> = ({
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
        amenityName: initialData.amenityName,
        iconKey: (initialData.iconKey || "FaUsers") as AmenityIconKey,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ iconKey: "FaUsers" });
    }
  }, [open, mode, initialData, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    onSubmit({
      amenityName: values.amenityName.trim(),
      iconKey: values.iconKey,
    });
  };

  return (
    <Modal
      open={open}
      title={
        mode === "create"
          ? "Tạo thiết bị & tiện ích"
          : "Cập nhật thiết bị & tiện ích"
      }
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
      okText={mode === "create" ? "Tạo" : "Cập nhật"}
      cancelText="Hủy"
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Tên thiết bị & tiện ích"
          name="amenityName"
          rules={[
            {
              required: true,
              message: "Vui lòng nhập tên thiết bị & tiện ích",
            },
            { max: 100, message: "Tối đa 100 ký tự" },
          ]}
        >
          <Input placeholder="Ví dụ: WiFi, Máy chiếu..." />
        </Form.Item>

        <Form.Item
          label="Biểu tượng"
          name="iconKey"
          rules={[{ required: true, message: "Vui lòng chọn biểu tượng" }]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            options={AMENITY_ICON_OPTIONS.map((x) => {
              const Icon = AMENITY_ICON_MAP[x.value];
              return {
                value: x.value,
                label: x.label,
                // AntD Select hỗ trợ render label qua optionLabelProp
                // Mình render trực tiếp trong option via "label" string, còn dropdownRender dùng children
              };
            })}
            optionRender={(option) => {
              const key = option.value as AmenityIconKey;
              const Icon = AMENITY_ICON_MAP[key] ?? AMENITY_ICON_MAP.FaUsers;
              return (
                <div className="flex items-center gap-2">
                  <Icon className="text-[#4da6ff]" />
                  <span>{option.label as string}</span>
                  <span className="text-xs text-gray-400">({key})</span>
                </div>
              );
            }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AmenityFormModal;
