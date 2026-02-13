import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Drawer,
  Form,
  Image,
  Input,
  InputNumber,
  Select,
  Space,
  Tag,
  Upload,
  message,
} from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import { SaveOutlined } from "@ant-design/icons";

import roomsService, {
  type RoomResponse,
  type RoomStatus,
} from "../../../services/rooms/rooms";
import categoriesService from "../../../services/categories/categories";
import amenitiesService from "../../../services/amenities/amenities";

type Props = {
  open: boolean;
  roomId: string | null;
  mode: "view" | "edit";
  onClose: () => void;
  onUpdated: () => void;
};

const statusColor = (s: RoomStatus) => {
  if (s === "ACTIVE") return "green";
  if (s === "HIDDEN") return "gold";
  if (s === "INACTIVE") return "red";
  return "blue";
};

const RoomDetailDrawer: React.FC<Props> = ({
  open,
  roomId,
  mode,
  onClose,
  onUpdated,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<RoomResponse | null>(null);
  const [form] = Form.useForm();

  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<
    { label: string; value: number }[]
  >([]);
  const [amenityOptions, setAmenityOptions] = useState<
    { label: string; value: number }[]
  >([]);

  const isEdit = mode === "edit";

  const fetchOptions = async () => {
    try {
      const [cRes, aRes] = await Promise.all([
        categoriesService.getAllCategories(),
        amenitiesService.getAllAmenities(),
      ]);

      setCategoryOptions(
        (cRes.result || [])
          .slice()
          .sort((a, b) => a.categoryName.localeCompare(b.categoryName))
          .map((c) => ({ label: c.categoryName, value: c.categoryId })),
      );

      setAmenityOptions(
        (aRes.result || [])
          .slice()
          .sort((a, b) => a.amenityName.localeCompare(b.amenityName))
          .map((a) => ({ label: a.amenityName, value: a.amenityId })),
      );
    } catch (e) {
      console.error(e);
      // không block UI nếu options fail
    }
  };

  const fetchDetail = async () => {
    if (!roomId) return;
    setLoading(true);
    try {
      const res = await roomsService.getRoomDetail(roomId);
      const room = res.result;
      setData(room);

      form.setFieldsValue({
        roomName: room.roomName,
        description: room.description,
        price: room.price,
        capacity: room.capacity,
        area: room.area,
        categoryId: room.categoryId,
        amenityIds: (room.amenities || []).map((a) => a.amenityId),
      });

      setFileList([]);
    } catch (e: any) {
      console.error(e);
      message.error(
        e?.response?.data?.message || "Không tải được chi tiết phòng",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    fetchOptions();
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, roomId]);

  const header = useMemo(() => {
    if (!data) return "Chi tiết phòng";
    return (
      <Space direction="vertical" size={4} style={{ width: "100%" }}>
        <div
          style={{ display: "flex", justifyContent: "space-between", gap: 12 }}
        >
          <div style={{ fontSize: 18, fontWeight: 700 }}>{data.roomName}</div>
          <Tag color={statusColor(data.roomStatus)}>{data.roomStatus}</Tag>
        </div>
        <div style={{ color: "#666" }}>
          {data.categoryName
            ? `Loại phòng: ${data.categoryName}`
            : "Chưa chọn loại phòng"}
        </div>
      </Space>
    );
  }, [data]);

  const onSave = async () => {
    if (!roomId) return;

    try {
      const values = await form.validateFields();
      const images = fileList
        .map((f) => f.originFileObj)
        .filter(Boolean) as File[];

      setSaving(true);

      const payload = {
        roomName: values.roomName,
        description: values.description,
        price: values.price,
        capacity: values.capacity,
        area: values.area,
        categoryId: values.categoryId,
        amenityIds: values.amenityIds,
        replaceImages: images.length ? true : false,
      };

      const updated = await roomsService.updateRoom(
        roomId,
        payload,
        images.length ? images : undefined,
      );
      setData(updated.result);
      message.success("Cập nhật phòng thành công");
      onUpdated();
      await fetchDetail();
    } catch (e: any) {
      if (e?.errorFields) return; // form validate
      console.error(e);
      message.error(e?.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      title={header}
      open={open}
      width={720}
      onClose={onClose}
      destroyOnClose
      loading={loading}
      extra={
        isEdit ? (
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            onClick={onSave}
          >
            Lưu
          </Button>
        ) : null
      }
    >
      {data?.images?.length ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 8,
            marginBottom: 16,
          }}
        >
          {data.images
            .slice()
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
            .map((img) => (
              <Image
                key={img.roomImageId}
                src={img.imageUrl}
                height={120}
                style={{ objectFit: "cover" }}
              />
            ))}
        </div>
      ) : (
        <div style={{ marginBottom: 16, color: "#999" }}>Chưa có ảnh</div>
      )}

      <Form
        form={form}
        layout="vertical"
        disabled={!isEdit}
        initialValues={{ amenityIds: [] }}
      >
        <Form.Item
          name="roomName"
          label="Tên phòng"
          rules={[{ required: true, message: "Nhập tên phòng" }]}
        >
          <Input placeholder="VD: Phòng A101" />
        </Form.Item>

        <Form.Item name="description" label="Mô tả">
          <Input.TextArea rows={4} placeholder="Mô tả chi tiết..." />
        </Form.Item>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
          }}
        >
          <Form.Item name="price" label="Giá/giờ">
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              placeholder="VD: 100000"
            />
          </Form.Item>

          <Form.Item name="capacity" label="Sức chứa">
            <InputNumber
              style={{ width: "100%" }}
              min={1}
              placeholder="VD: 20"
            />
          </Form.Item>

          <Form.Item name="area" label="Diện tích (m²)">
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              placeholder="VD: 35"
            />
          </Form.Item>
        </div>

        <Form.Item name="categoryId" label="Loại phòng">
          <Select
            placeholder="Chọn loại phòng"
            options={categoryOptions}
            allowClear
          />
        </Form.Item>

        <Form.Item name="amenityIds" label="Tiện ích">
          <Select
            mode="multiple"
            placeholder="Chọn tiện ích"
            options={amenityOptions}
          />
        </Form.Item>

        {isEdit && (
          <Form.Item label="Cập nhật ảnh (1-5 ảnh)">
            <Upload
              listType="picture-card"
              fileList={fileList}
              beforeUpload={() => false}
              onChange={({ fileList }) => setFileList(fileList.slice(0, 5))}
            >
              {fileList.length >= 5 ? null : "Upload"}
            </Upload>
            <div style={{ color: "#999", fontSize: 12 }}>
              Upload ảnh mới sẽ <b>thay toàn bộ ảnh cũ</b>.
            </div>
          </Form.Item>
        )}
      </Form>
    </Drawer>
  );
};

export default RoomDetailDrawer;
