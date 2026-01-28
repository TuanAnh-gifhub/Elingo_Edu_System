import React, { useEffect, useState } from "react";
import {
  Table,
  Tag,
  Card,
  Button,
  message,
  Select,
  Dropdown,
  type MenuProps,
  Modal,
  Descriptions,
  Tooltip,
} from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import {
  ReloadOutlined,
  EditOutlined,
  MoreOutlined,
  EyeOutlined,
  LockOutlined,
  UnlockOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { userService, type UserResponse } from "../../services/usersService";

const { Option } = Select;

const UserManagement: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<UserResponse[]>([]);

  // State cho Modal xem chi tiết
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);

  const [filters, setFilters] = useState({
    role: undefined as string | undefined,
    active: true as boolean | undefined,
  });

  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    pageSizeOptions: ["5", "10", "20", "50"],
  });

  const fetchUsers = async (
    page: number,
    size: number,
    currentFilters = filters,
  ) => {
    setLoading(true);
    try {
      const apiPage = page - 1;
      const response: any = await userService.getAllUsers(
        apiPage,
        size,
        currentFilters.role,
        currentFilters.active,
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

  // --- XỬ LÝ XEM CHI TIẾT ---
  const handleViewDetail = (user: UserResponse) => {
    setSelectedUser(user); // Lưu user được chọn vào state
    setIsDetailModalOpen(true); // Mở modal
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedUser(null);
  };
  // ---------------------------

  const handleEdit = (user: UserResponse) => {
    console.log("Sửa:", user);
  };

  const handleToggleStatus = (user: UserResponse) => {
    const actionText = user.active ? "khóa" : "mở khóa";
    Modal.confirm({
      title: `Xác nhận ${actionText}`,
      content: `Bạn có chắc muốn ${actionText} tài khoản ${user.userName}?`,
      onOk: async () => {
        console.log("Gọi API đổi trạng thái cho ID:", user.userId);
        message.success(`Đã ${actionText} thành công`);
      },
    });
  };

  const columns: ColumnsType<UserResponse> = [
    {
      title: "STT",
      key: "index",
      width: 60,
      align: "center",
      render: (_, __, index) => {
        const currentPage = pagination.current || 1;
        const pageSize = pagination.pageSize || 10;
        return (currentPage - 1) * pageSize + index + 1;
      },
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 250,
      ellipsis: {
        showTitle: false,
      },
      render: (email) => (
        <Tooltip placement="topLeft" title={email}>
          {email}
        </Tooltip>
      ),
    },
    {
      title: "Username",
      dataIndex: "userName",
      key: "userName",
      width: 150,
      ellipsis: true,
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      width: 80,
      align: "center",
      render: (role) => {
        let color = role === "ADMIN" ? "blue" : "geekblue";
        if (role === "RENTER") color = "cyan";
        if (role === "OWNER") color = "purple";
        return <Tag color={color}>{role ? role.toUpperCase() : "N/A"}</Tag>;
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "active",
      key: "active",
      width: 100,
      align: "center",
      render: (active) => (
        <Tag color={active ? "success" : "error"}>
          {active ? "Hoạt động" : "Bị khóa"}
        </Tag>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 100,
      align: "center",
      render: (date) =>
        date ? new Date(date).toLocaleDateString("vi-VN") : "-",
    },
    {
      title: "Hành động",
      key: "action",
      align: "center",
      width: 80,
      fixed: "right",
      render: (_, record) => {
        const items: MenuProps["items"] = [
          {
            key: "detail",
            label: "Xem chi tiết",
            icon: <EyeOutlined />,
            onClick: () => handleViewDetail(record),
          },
          {
            key: "edit",
            label: "Chỉnh sửa",
            icon: <EditOutlined />,
            onClick: () => handleEdit(record),
          },
          {
            key: "toggle_status",
            label: record.active ? "Khóa tài khoản" : "Mở khóa",
            icon: record.active ? <LockOutlined /> : <UnlockOutlined />,
            danger: record.active,
            onClick: () => handleToggleStatus(record),
          },
          {
            type: "divider",
          },
        ];

        return (
          <Dropdown
            menu={{ items }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <Button
              type="text"
              icon={<MoreOutlined style={{ fontSize: "20px" }} />}
            />
          </Dropdown>
        );
      },
    },
  ];

  // Helper function render role color trong Modal
  const renderRoleTag = (role: string) => {
    let color = "geekblue";
    if (role === "ADMIN") color = "blue";
    if (role === "RENTER") color = "cyan";
    if (role === "OWNER") color = "purple";
    return <Tag color={color}>{role}</Tag>;
  };

  return (
    <div className="p-4">
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
        <div className="mb-4 flex gap-4 flex-wrap">
          <Select
            placeholder="Chọn vai trò"
            style={{ width: 200 }}
            allowClear
            onChange={(value) => handleFilterChange("role", value)}
            value={filters.role}
          >
            <Option value="ADMIN">Quản trị viên (ADMIN)</Option>
            <Option value="OWNER">Chủ xe (OWNER)</Option>
            <Option value="RENTER">Khách thuê (RENTER)</Option>
          </Select>

          <Select
            placeholder="Trạng thái"
            style={{ width: 200 }}
            onChange={(value) => handleFilterChange("active", value)}
            value={filters.active}
          >
            <Option value={undefined}>Tất cả trạng thái</Option>
            <Option value={true}>Đang hoạt động</Option>
            <Option value={false}>Đã bị khóa</Option>
          </Select>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey={(record) => record.userId || record.email}
          pagination={pagination}
          loading={loading}
          onChange={handleTableChange}
          bordered
          scroll={{ x: 800 }}
        />
      </Card>

      {/* --- MODAL XEM CHI TIẾT --- */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <UserOutlined /> Thông tin chi tiết người dùng
          </div>
        }
        open={isDetailModalOpen}
        onCancel={handleCloseDetailModal}
        footer={[
          <Button key="close" onClick={handleCloseDetailModal}>
            Đóng
          </Button>,
        ]}
        width={700} // Độ rộng modal
      >
        {selectedUser && (
          <Descriptions
            bordered
            column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
          >
            <Descriptions.Item label="ID" span={2}>
              {selectedUser.userId}
            </Descriptions.Item>

            <Descriptions.Item label="Tên đăng nhập">
              {selectedUser.userName}
            </Descriptions.Item>

            <Descriptions.Item label="Email" span={2}>
              {selectedUser.email}
            </Descriptions.Item>

            <Descriptions.Item label="Số điện thoại">
              {selectedUser.phone || "Chưa cập nhật"}
            </Descriptions.Item>
            <Descriptions.Item label="Giới tính">
              {selectedUser.gender || "Chưa cập nhật"}
            </Descriptions.Item>

            <Descriptions.Item label="Ngày sinh">
              {selectedUser.dateOfBirth
                ? new Date(selectedUser.dateOfBirth).toLocaleDateString("vi-VN")
                : "Chưa cập nhật"}
            </Descriptions.Item>
            <Descriptions.Item label="Tuổi">
              {selectedUser.age || "-"}
            </Descriptions.Item>

            <Descriptions.Item label="Vai trò">
              {renderRoleTag(selectedUser.role)}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={selectedUser.active ? "success" : "error"}>
                {selectedUser.active ? "Hoạt động" : "Bị khóa"}
              </Tag>
            </Descriptions.Item>

            <Descriptions.Item label="Ngày tạo">
              {new Date(selectedUser.createdAt).toLocaleString("vi-VN")}
            </Descriptions.Item>
            <Descriptions.Item label="Cập nhật cuối">
              {selectedUser.updatedAt
                ? new Date(selectedUser.updatedAt).toLocaleString("vi-VN")
                : "-"}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default UserManagement;
