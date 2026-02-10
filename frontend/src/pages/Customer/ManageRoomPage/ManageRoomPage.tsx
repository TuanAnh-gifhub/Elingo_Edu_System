import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, Empty, message, Pagination } from "antd";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

import rentalAreasService, {
  type RentalAreaResponse,
  type RentalAreaStatus,
} from "../../../services/rental-areas/rentalAreas";

import citiesService, {
  type CityResponse,
} from "../../../services/cities/cities";

import PageHeader from "./PageHeader";
import RentalAreaFilters from "./RentalAreaFilters";
import RentalAreaTable from "./RentalAreaTable";
import CreateRentalAreaModal from "./CreateRentalAreaModal";
import UpdateRentalAreaModal from "./UpdateRentalAreaModal";

const ManageRoomPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<RentalAreaResponse[]>([]);

  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filters
  const [statusFilter, setStatusFilter] = useState<
    RentalAreaStatus | undefined
  >(undefined);
  const [keywordFilter, setKeywordFilter] = useState("");

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editing, setEditing] = useState<RentalAreaResponse | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      message.warning("Vui lòng đăng nhập để quản lý tòa nhà");
      navigate("/");
    }
  }, [authLoading, isAuthenticated, navigate]);

  const fetchMyRentalAreas = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    try {
      const res = await rentalAreasService.getMyRentalAreas();
      setItems(res.result || []);
    } catch (e) {
      console.error(e);
      message.error("Đã xảy ra lỗi khi tải danh sách tòa nhà");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) fetchMyRentalAreas();
  }, [isAuthenticated, fetchMyRentalAreas]);

  const [cities, setCities] = useState<CityResponse[]>([]);

  const fetchCities = useCallback(async () => {
    try {
      const res = await citiesService.getAllCities();
      setCities(res.result || []);
    } catch (e) {
      console.error(e);
      message.error("Không tải được danh sách thành phố");
      setCities([]);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchCities();
  }, [isAuthenticated, fetchCities]);

  const filtered = useMemo(() => {
    let arr = [...items];

    if (statusFilter) arr = arr.filter((x) => x.status === statusFilter);

    const k = keywordFilter.trim().toLowerCase();
    if (k) {
      arr = arr.filter(
        (x) =>
          x.rentalAreaName.toLowerCase().includes(k) ||
          x.address.toLowerCase().includes(k),
      );
    }

    return arr;
  }, [items, statusFilter, keywordFilter]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  useEffect(() => {
    setTotal(filtered.length);
    setCurrentPage(1);
  }, [filtered]);

  const handleRefresh = () => fetchMyRentalAreas();

  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  const handleOpenCreate = () => setCreateOpen(true);
  const handleCloseCreate = () => setCreateOpen(false);

  const handleCreate = async (data: {
    rentalAreaName: string;
    address: string;
    contactName?: string;
    contactPhone?: string;
    cityId: number;
    images: File[];
  }) => {
    setCreateLoading(true);
    try {
      await rentalAreasService.createRentalArea(data);
      message.success("Tạo tòa nhà thành công");
      setCreateOpen(false);
      await fetchMyRentalAreas();
    } catch (e) {
      console.error(e);
      message.error("Tạo tòa nhà thất bại");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleAddRoom = (rentalArea: RentalAreaResponse) => {
    // Dừng trước phần Room
    message.info(
      `Chuyển sang màn tạo phòng cho: ${rentalArea.rentalAreaName} (làm sau)`,
    );
    // Nếu bạn muốn navigate sau này:
    // navigate("/manage-rooms/create", { state: { rentalAreaId: rentalArea.rentalAreaId }});
  };

  const handleDeleteRentalArea = async (ra: RentalAreaResponse) => {
    try {
      await rentalAreasService.deleteRentalArea(ra.rentalAreaId);
      message.success("Xóa tòa nhà thành công");
      await fetchMyRentalAreas();
    } catch (e) {
      console.error(e);
      message.error("Xóa tòa nhà thất bại");
    }
  };

  const handleToggleStatus = async (
    ra: RentalAreaResponse,
    nextStatus: "ACTIVE" | "INACTIVE",
  ) => {
    if (ra.status === "SUSPENDED") {
      message.warning("Tòa nhà đang bị khóa, không thể đổi trạng thái");
      return;
    }

    try {
      await rentalAreasService.updateRentalAreaStatus(
        ra.rentalAreaId,
        nextStatus,
      );
      message.success("Cập nhật trạng thái thành công");
      await fetchMyRentalAreas();
    } catch (e) {
      console.error(e);
      message.error("Cập nhật trạng thái thất bại");
    }
  };

  const handleEditRentalArea = (ra: RentalAreaResponse) => {
    setEditing(ra);
    setEditOpen(true);
  };

  const handleCloseEdit = () => {
    setEditOpen(false);
    setEditing(null);
  };

  const handleUpdate = async (payload: {
    rentalAreaName: string;
    address: string;
    contactName?: string;
    contactPhone?: string;
    cityId: number;
  }) => {
    if (!editing) return;

    setEditLoading(true);
    try {
      await rentalAreasService.updateRentalArea(editing.rentalAreaId, payload);
      message.success("Cập nhật tòa nhà thành công");
      setEditOpen(false);
      setEditing(null);
      await fetchMyRentalAreas();
    } catch (e) {
      console.error(e);
      message.error("Cập nhật tòa nhà thất bại");
    } finally {
      setEditLoading(false);
    }
  };

  const handleViewRentalArea = (ra: RentalAreaResponse) => {
    message.info(`Xem chi tiết: ${ra.rentalAreaName} (làm sau)`);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4da6ff] mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="bg-gray-50 py-4">
      <div className="px-4">
        <PageHeader onCreate={handleOpenCreate} />

        <RentalAreaFilters
          keyword={keywordFilter}
          status={statusFilter}
          loading={loading}
          onKeywordChange={setKeywordFilter}
          onStatusChange={setStatusFilter}
          onRefresh={handleRefresh}
        />

        <Card className="shadow-sm">
          {paginated.length === 0 && !loading ? (
            <Empty
              description="Bạn chưa có tòa nhà nào"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <button
                className="ant-btn ant-btn-primary"
                onClick={handleOpenCreate}
              >
                Thêm tòa nhà đầu tiên
              </button>
            </Empty>
          ) : (
            <>
              <RentalAreaTable
                data={paginated}
                onAddRoom={handleAddRoom}
                onToggleStatus={handleToggleStatus}
                onDelete={handleDeleteRentalArea}
                onEdit={handleEditRentalArea}
                onView={handleViewRentalArea}
              />

              {total > 0 && (
                <div className="mt-4 flex justify-end">
                  <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={total}
                    onChange={handlePageChange}
                    onShowSizeChange={handlePageChange}
                    showSizeChanger
                    showTotal={(t, range) =>
                      `${range[0]}-${range[1]} của ${t} tòa nhà`
                    }
                    pageSizeOptions={["10", "20", "50", "100"]}
                  />
                </div>
              )}
            </>
          )}
        </Card>

        <CreateRentalAreaModal
          open={createOpen}
          loading={createLoading}
          cities={cities}
          onClose={handleCloseCreate}
          onSubmit={handleCreate}
        />

        <UpdateRentalAreaModal
          open={editOpen}
          loading={editLoading}
          cities={cities}
          initial={editing}
          onClose={handleCloseEdit}
          onSubmit={handleUpdate}
        />
      </div>
    </div>
  );
};

export default ManageRoomPage;
