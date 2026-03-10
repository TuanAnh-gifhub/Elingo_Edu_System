import React, { useEffect, useState } from "react";
import { Card, Button, message, Modal } from "antd";
import type { TablePaginationConfig } from "antd/es/table";
import { ReloadOutlined } from "@ant-design/icons";
import { userService, type UserResponse } from "../../../services/usersService";

// Import components con
import UserFilter from "./UserFilter";
import UserTable from "./UserTable";
import UserDetailModal from "./UserDetailModal";
import UserEditModal from "./UserEditModal";

const UserManagement: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<UserResponse[]>([]);

  // --- STATE ---
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null);

  const [filters, setFilters] = useState({
    role: undefined as string | undefined,
    active: true as boolean | undefined,
    keyword: "" as string,
  });

  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    pageSizeOptions: ["5", "10", "20", "50"],
  });

  // --- API CALLS ---
  const fetchUsers = async (
    page: number,
    size: number,
    currentFilters = filters,
  ) => {
    setLoading(true);
    try {
      const apiPage = page;
      const response: any = await userService.getAllUsers(
        apiPage,
        size,
        currentFilters.role,
        currentFilters.active,
        currentFilters.keyword,
      );

      const actualResponse = response.data ? response.data : response;

      if (actualResponse && actualResponse.code === 200) {
        const pageData = actualResponse.result;
        setData(pageData.data);
        setPagination((prev) => ({
          ...prev,
          current: page,
          total: pageData.totalElements,
          pageSize: size,
        }));
      } else {
        message.error(actualResponse?.message || "Lấy danh sách thất bại");
      }
    } catch (error) {
      console.error("Fetch users error:", error);
      message.error("Đã xảy ra lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(pagination.current || 1, pagination.pageSize || 10, filters);
  }, []);

  // --- HANDLERS LOGIC ---

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchUsers(1, pagination.pageSize || 10, newFilters);
  };

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    fetchUsers(
      newPagination.current || 1,
      newPagination.pageSize || 10,
      filters,
    );
  };

  // Logic View Detail
  const handleViewDetail = (user: UserResponse) => {
    setSelectedUser(user);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedUser(null);
  };

  // Logic Edit
  const handleEdit = (user: UserResponse) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingUser(null);
  };

  const handleUpdateSubmit = async (values: any) => {
    if (!editingUser) return;

    setLoading(true);
    try {
      const requestData: any = {
        userName: values.userName,
        phone: values.phone,
        gender: values.gender,
        dateOfBirth: values.dateOfBirth
          ? values.dateOfBirth.format("YYYY-MM-DD")
          : null,
      };

      const response: any = await userService.updateUser(
        editingUser.userId,
        requestData,
      );

      if (response?.code === 200 || response?.data?.code === 200) {
        message.success("Cập nhật thông tin thành công!");
        handleCloseEditModal();
        fetchUsers(pagination.current || 1, pagination.pageSize || 10, filters);
      } else {
        message.error(response?.message || "Cập nhật thất bại");
      }
    } catch (error) {
      console.error("Update error:", error);
      message.error("Đã xảy ra lỗi khi cập nhật");
    } finally {
      setLoading(false);
    }
  };

  // Logic Toggle Status
  const handleToggleStatus = (user: UserResponse) => {
    const newStatus = !user.active;
    const actionText = newStatus ? "mở khóa" : "khóa";

    Modal.confirm({
      title: `Xác nhận ${actionText}`,
      content: (
        <span>
          Bạn có chắc muốn <b>{actionText}</b> tài khoản <b>{user.userName}</b>?
        </span>
      ),
      okText: "Xác nhận",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          const response: any = await userService.updateStatus(
            user.userId,
            newStatus,
          );

          if (response?.code === 200 || response?.data?.code === 200) {
            message.success(`Đã ${actionText} tài khoản thành công!`);
            fetchUsers(
              pagination.current || 1,
              pagination.pageSize || 10,
              filters,
            );
          } else {
            message.error(response?.message || "Cập nhật thất bại");
          }
        } catch (error) {
          console.error("Lỗi update status:", error);
          message.error("Đã xảy ra lỗi khi cập nhật trạng thái.");
        }
      },
    });
  };

  // --- RENDER ---
  return (
    // <div className="">
    <>
      <Card
        title="Danh sách người dùng"
        className="shadow-md"
        extra={
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={() =>
              fetchUsers(
                pagination.current || 1,
                pagination.pageSize || 10,
                filters,
              )
            }
            loading={loading}
          >
            Làm mới
          </Button>
        }
      >
        <UserFilter filters={filters} onFilterChange={handleFilterChange} />

        <UserTable
          data={data}
          loading={loading}
          pagination={pagination}
          onTableChange={handleTableChange}
          onViewDetail={handleViewDetail}
          onEdit={handleEdit}
          onToggleStatus={handleToggleStatus}
        />
      </Card>

      <UserDetailModal
        open={isDetailModalOpen}
        user={selectedUser}
        onClose={handleCloseDetailModal}
      />

      <UserEditModal
        open={isEditModalOpen}
        user={editingUser}
        loading={loading}
        onCancel={handleCloseEditModal}
        onSubmit={handleUpdateSubmit}
      />
    </>
    
    // </div>
  );
};

export default UserManagement;
