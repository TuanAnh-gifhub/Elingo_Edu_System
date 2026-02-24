import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, Empty, message, Pagination } from "antd";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import type { RentalArea, RentalAreaStatus } from "../../../types/rentalArea";
import { rentalAreaApi } from "../../../services/rentalAreaApi";

import PageHeader from "./components/PageHeader";
import RentalAreaFilters from "./components/RentalAreaFilters";
import RentalAreaTable from "./components/RentalAreaTable";
import CreateRentalAreaModal from "./components/CreateRentalAreaModal";

const ManageRentalAreasPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [loading, setLoading] = useState(false);

  const [rentalAreas, setRentalAreas] = useState<RentalArea[]>([]);
  const [total, setTotal] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filters
  const [statusFilter, setStatusFilter] = useState<
    RentalAreaStatus | undefined
  >(undefined);
  const [keywordFilter, setKeywordFilter] = useState<string>("");

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      message.warning("Vui lòng đăng nhập để quản lý tòa nhà");
      navigate("/");
    }
  }, [isAuthenticated, authLoading, navigate]);

  const fetchMyRentalAreas = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const data = await rentalAreaApi.getMyRentalAreas();
      setRentalAreas(data);
    } catch (e: any) {
      console.error(e);
      message.error("Đã xảy ra lỗi khi tải danh sách tòa nhà");
      setRentalAreas([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) fetchMyRentalAreas();
  }, [isAuthenticated, fetchMyRentalAreas]);

  const filtered = useMemo(() => {
    let arr = [...rentalAreas];

    if (statusFilter) {
      arr = arr.filter((x) => x.status === statusFilter);
    }
    if (keywordFilter.trim()) {
      const k = keywordFilter.trim().toLowerCase();
      arr = arr.filter(
        (x) =>
          x.rentalAreaName.toLowerCase().includes(k) ||
          x.address.toLowerCase().includes(k),
      );
    }

    return arr;
  }, [rentalAreas, statusFilter, keywordFilter]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filtered.slice(start, end);
  }, [filtered, currentPage, pageSize]);

  useEffect(() => {
    setTotal(filtered.length);
    // reset về page 1 khi filter thay đổi để tránh page out-of-range
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
    cityId: string;
    images: File[];
  }) => {
    setCreateLoading(true);
    try {
      await rentalAreaApi.createRentalArea(data);
      message.success("Tạo tòa nhà thành công");
      setCreateOpen(false);
      await fetchMyRentalAreas();
    } catch (e: any) {
      console.error(e);
      message.error("Tạo tòa nhà thất bại");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleAddRoom = (rentalArea: RentalArea) => {
    // DỪNG Ở ĐÂY: chỉ truyền rentalAreaId sang trang tạo room.
    // Bạn có thể dùng state hoặc query param.
    navigate("/manage-rooms/create", {
      state: { rentalAreaId: rentalArea.rentalAreaId, rentalArea },
    });
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
          onKeywordChange={(v) => setKeywordFilter(v)}
          onStatusChange={(v) => setStatusFilter(v)}
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
              <RentalAreaTable data={paginated} onAddRoom={handleAddRoom} />

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
          onClose={handleCloseCreate}
          onSubmit={handleCreate}
        />
      </div>
    </div>
  );
};

export default ManageRentalAreasPage;
