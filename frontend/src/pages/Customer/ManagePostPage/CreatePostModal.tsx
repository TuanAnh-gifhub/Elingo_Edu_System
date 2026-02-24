import React, { useEffect, useMemo, useState } from "react";
import { Form, Input, Modal, Select, message } from "antd";
import rentalAreasService, {
  type RentalAreaResponse,
} from "../../../services/rental-areas/rentalAreas";
import roomsService, {
  type RoomCardResponse,
} from "../../../services/rooms/rooms";
import postsService, {
  type PostSummaryResponse,
} from "../../../services/posts/posts";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

type RoomOption = { label: string; value: string };

const CreatePostModal: React.FC<Props> = ({ open, onClose, onCreated }) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const [loadingRooms, setLoadingRooms] = useState(false);
  const [roomOptions, setRoomOptions] = useState<RoomOption[]>([]);

  const fetchSelectableRooms = async () => {
    setLoadingRooms(true);
    try {
      const [raRes, postRes] = await Promise.all([
        rentalAreasService.getMyRentalAreas(),
        postsService.getMyPosts(),
      ]);

      const rentalAreas: RentalAreaResponse[] = raRes.result || [];
      const myPosts: PostSummaryResponse[] = postRes.result || [];
      const postedRoomIds = new Set(myPosts.map((p) => p.roomId));

      // load rooms for each rental area
      const roomLists = await Promise.all(
        rentalAreas.map((ra) =>
          roomsService.getRoomsByRentalArea(String(ra.rentalAreaId)),
        ),
      );

      const rooms: RoomCardResponse[] = roomLists.flatMap(
        (x) => x.result || [],
      );

      const selectable = rooms
        .filter((r) => !postedRoomIds.has(r.roomId))
        .sort((a, b) => a.roomName.localeCompare(b.roomName))
        .map((r) => ({
          value: r.roomId,
          label: `${r.roomName} (${r.capacity ?? "-"} người • ${r.price ?? "-"} / giờ)`,
        }));

      setRoomOptions(selectable);
    } catch (e) {
      console.error(e);
      message.error("Không tải được danh sách phòng để tạo bài");
      setRoomOptions([]);
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    fetchSelectableRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const canCreate = useMemo(() => roomOptions.length > 0, [roomOptions]);

  const onSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!values.roomId) {
        message.error("Vui lòng chọn phòng");
        return;
      }

      setSaving(true);

      await postsService.createPost({
        roomId: values.roomId,
        title: values.title,
        content: values.content,
      });

      message.success("Tạo tin đăng thành công (chờ duyệt)");
      onCreated();
    } catch (e: any) {
      if (e?.errorFields) return;
      console.error(e);
      message.error(e?.response?.data?.message || "Tạo tin đăng thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Tạo tin đăng"
      open={open}
      onCancel={onClose}
      onOk={onSubmit}
      okText="Tạo"
      cancelText="Hủy"
      confirmLoading={saving}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="roomId"
          label="Chọn phòng (phòng chưa có tin đăng)"
          rules={[{ required: true, message: "Chọn phòng" }]}
        >
          <Select
            placeholder={
              canCreate ? "Chọn phòng" : "Không còn phòng nào chưa có tin đăng"
            }
            options={roomOptions}
            loading={loadingRooms}
            disabled={!canCreate}
            showSearch
            filterOption={(input, option) =>
              String(option?.label ?? "")
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          />
        </Form.Item>

        <Form.Item
          name="title"
          label="Tiêu đề"
          rules={[
            { required: true, message: "Nhập tiêu đề" },
            { max: 150, message: "Tối đa 150 ký tự" },
          ]}
        >
          <Input placeholder="VD: Phòng lab mới, nhiều tiện ích..." />
        </Form.Item>

        <Form.Item
          name="content"
          label="Nội dung"
          rules={[{ required: true, message: "Nhập nội dung" }]}
        >
          <Input.TextArea rows={5} placeholder="Mô tả chi tiết..." />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreatePostModal;
