import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Empty,
  Image,
  Popconfirm,
  Space,
  Spin,
  Tag,
  Tooltip,
  message,
} from "antd";
import { DeleteOutlined, EditOutlined, EyeOutlined } from "@ant-design/icons";

import roomsService, {
  type RoomCardResponse,
  type RoomStatus,
} from "../../../services/rooms/rooms";
import RoomDetailDrawer from "./RoomDetailDrawer";

type Props = {
  rentalAreaId: string;
  onChanged?: () => void;
};

const statusColor = (s: RoomStatus) => {
  if (s === "ACTIVE") return "green";
  if (s === "HIDDEN") return "gold";
  if (s === "INACTIVE") return "red";
  return "blue";
};

const RoomCardList: React.FC<Props> = ({ rentalAreaId, onChanged }) => {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<RoomCardResponse[]>([]);

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"view" | "edit">("view");

  const fetchList = async () => {
    if (!rentalAreaId) return;
    setLoading(true);
    try {
      const res = await roomsService.getRoomsByRentalArea(rentalAreaId);
      setItems(res.result || []);
    } catch (e: any) {
      console.error(e);
      message.error(
        e?.response?.data?.message || "Không tải được danh sách phòng",
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rentalAreaId]);

  const openDrawer = (roomId: string, mode: "view" | "edit") => {
    setSelectedRoomId(roomId);
    setDrawerMode(mode);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedRoomId(null);
  };

  const onToggleStatus = async (room: RoomCardResponse) => {
    const next = room.roomStatus === "ACTIVE" ? "HIDDEN" : "ACTIVE";
    try {
      await roomsService.updateRoomStatus(room.roomId, next);
      message.success("Cập nhật trạng thái thành công");
      await fetchList();
      onChanged?.();
    } catch (e: any) {
      console.error(e);
      message.error(
        e?.response?.data?.message || "Cập nhật trạng thái thất bại",
      );
    }
  };

  const onDelete = async (roomId: string) => {
    try {
      await roomsService.deleteRoom(roomId);
      message.success("Xóa phòng thành công");
      await fetchList();
      onChanged?.();
    } catch (e: any) {
      console.error(e);
      message.error(e?.response?.data?.message || "Xóa phòng thất bại");
    }
  };

  const content = useMemo(() => {
    if (loading) return <Spin />;

    if (!items.length) {
      return (
        <Empty
          description="Chưa có phòng nào trong tòa nhà này"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      );
    }

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 16,
        }}
      >
        {items.map((r) => (
          <Card
            key={r.roomId}
            hoverable
            cover={
              r.coverImageUrl ? (
                <Image
                  src={r.coverImageUrl}
                  preview={false}
                  height={160}
                  style={{ objectFit: "cover" }}
                />
              ) : (
                <div
                  style={{
                    height: 160,
                    display: "grid",
                    placeItems: "center",
                    background: "#fafafa",
                  }}
                >
                  <span style={{ color: "#999" }}>No image</span>
                </div>
              )
            }
            actions={[
              <Tooltip title="Xem chi tiết" key="view">
                <EyeOutlined onClick={() => openDrawer(r.roomId, "view")} />
              </Tooltip>,
              <Tooltip title="Chỉnh sửa" key="edit">
                <EditOutlined onClick={() => openDrawer(r.roomId, "edit")} />
              </Tooltip>,
              <Popconfirm
                key="delete"
                title="Xóa phòng này?"
                okText="Xóa"
                cancelText="Hủy"
                onConfirm={() => onDelete(r.roomId)}
              >
                <DeleteOutlined />
              </Popconfirm>,
            ]}
          >
            <Space direction="vertical" size={6} style={{ width: "100%" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <div style={{ fontWeight: 600, lineHeight: 1.2 }}>
                  {r.roomName}
                </div>
                <Tag
                  color={statusColor(r.roomStatus)}
                  style={{ marginInlineEnd: 0 }}
                >
                  {r.roomStatus}
                </Tag>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: "#666",
                }}
              >
                <span>SL: {r.capacity ?? "--"}</span>
                <span>
                  {r.price ? `${Number(r.price).toLocaleString()} đ` : "--"}
                </span>
              </div>

              <Button block onClick={() => onToggleStatus(r)}>
                {r.roomStatus === "ACTIVE" ? "Ẩn phòng" : "Kích hoạt"}
              </Button>
            </Space>
          </Card>
        ))}
      </div>
    );
  }, [items, loading]);

  return (
    <>
      {content}

      <RoomDetailDrawer
        open={drawerOpen}
        roomId={selectedRoomId}
        mode={drawerMode}
        onClose={closeDrawer}
        onUpdated={async () => {
          await fetchList();
          onChanged?.();
        }}
      />
    </>
  );
};

export default RoomCardList;
