import React, { useMemo, useState } from "react";
import { Button, Divider, Drawer, Space, Tag } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import type { RentalAreaResponse } from "../../../services/rental-areas/rentalAreas";
import RoomCardList from "./RoomCardList";
import CreateRoomModal from "./CreateRoomModal";

type Props = {
  open: boolean;
  rentalArea: RentalAreaResponse | null;
  openCreateRoom?: boolean;
  onClose: () => void;
};

const statusColor = (s?: string) => {
  if (s === "ACTIVE") return "green";
  if (s === "INACTIVE") return "red";
  if (s === "SUSPENDED") return "volcano";
  return "blue";
};

const RentalAreaRoomsDrawer: React.FC<Props> = ({
  open,
  rentalArea,
  openCreateRoom,
  onClose,
}) => {
  const [createOpen, setCreateOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  React.useEffect(() => {
    if (open && openCreateRoom) {
      setCreateOpen(true);
    }
  }, [open, openCreateRoom]);

  const header = useMemo(() => {
    if (!rentalArea) return "Quản lý phòng";
    return (
      <Space direction="vertical" size={2} style={{ width: "100%" }}>
        <Space wrap>
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            {rentalArea.rentalAreaName}
          </div>
          <Tag color={statusColor(rentalArea.status)}>{rentalArea.status}</Tag>
        </Space>
        <div style={{ color: "#666" }}>{rentalArea.address}</div>
      </Space>
    );
  }, [rentalArea]);

  const closeCreate = () => setCreateOpen(false);

  return (
    <Drawer
      title={header}
      open={open}
      width={980}
      onClose={onClose}
      destroyOnClose
      extra={
        rentalArea ? (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateOpen(true)}
          >
            Thêm phòng
          </Button>
        ) : null
      }
    >
      {!rentalArea ? null : (
        <>
          <Divider style={{ marginTop: 0 }} />
          <RoomCardList
            key={refreshKey}
            rentalAreaId={rentalArea.rentalAreaId}
            onChanged={() => setRefreshKey((x) => x + 1)}
          />

          <CreateRoomModal
            open={createOpen}
            rentalAreaId={rentalArea.rentalAreaId}
            onClose={closeCreate}
            onCreated={() => {
              closeCreate();
              setRefreshKey((x) => x + 1);
            }}
          />
        </>
      )}
    </Drawer>
  );
};

export default RentalAreaRoomsDrawer;
