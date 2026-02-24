import React, { useEffect, useMemo, useState } from "react";
import { Button, Input, message } from "antd";
import amenitiesService, {
  type AmenityResponse,
  type CreateAmenityRequest,
  type UpdateAmenityRequest,
} from "../../../services/amenities/amenities";
import AmenityTable from "./AmenityTable";
import AmenityFormModal from "./AmenityFormModal";

const AmenityManagementPage: React.FC = () => {
  const [data, setData] = useState<AmenityResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const [keyword, setKeyword] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<AmenityResponse | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    if (!k) return data;
    return data.filter(
      (x) =>
        x.amenityName.toLowerCase().includes(k) ||
        (x.iconKey || "").toLowerCase().includes(k),
    );
  }, [data, keyword]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await amenitiesService.getAllAmenities();
      setData(res.result || []);
    } catch (e: any) {
      message.error(
        e?.response?.data?.message || "Lỗi tải danh sách amenities",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setModalMode("create");
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (item: AmenityResponse) => {
    setModalMode("edit");
    setEditing(item);
    setModalOpen(true);
  };

  const handleSubmit = async (
    payload: CreateAmenityRequest | UpdateAmenityRequest,
  ) => {
    try {
      setSubmitLoading(true);

      if (modalMode === "create") {
        await amenitiesService.createAmenity(payload as CreateAmenityRequest);
        message.success("Tạo amenity thành công");
      } else {
        if (!editing) return;
        await amenitiesService.updateAmenity(
          editing.amenityId,
          payload as UpdateAmenityRequest,
        );
        message.success("Cập nhật amenity thành công");
      }

      setModalOpen(false);
      await fetchData();
    } catch (e: any) {
      message.error(e?.response?.data?.message || "Thao tác thất bại");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await amenitiesService.deleteAmenity(id);
      message.success("Xóa amenity thành công");
      await fetchData();
    } catch (e: any) {
      message.error(e?.response?.data?.message || "Xóa thất bại");
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h1 className="text-2xl font-bold" style={{ color: "inherit" }}>
          Quản lý Thiết bị & Tiện ích
        </h1>

        <div className="flex items-center gap-2">
          <Input
            placeholder="Tìm theo tên hoặc iconKey..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-[260px]"
          />
          <Button type="primary" onClick={openCreate}>
            + Thêm mới
          </Button>
        </div>
      </div>

      <AmenityTable
        data={filtered}
        loading={loading}
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      <AmenityFormModal
        open={modalOpen}
        mode={modalMode}
        initialData={editing}
        loading={submitLoading}
        onCancel={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default AmenityManagementPage;
