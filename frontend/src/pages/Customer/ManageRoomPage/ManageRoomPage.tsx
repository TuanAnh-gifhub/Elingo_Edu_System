import React, { useState, useEffect, useCallback } from "react";
import { Card, Button, Input, Select, Space, message, Pagination, Empty } from "antd";
import {
    PlusOutlined,
    ReloadOutlined,
    SearchOutlined,
    HomeOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

const { Option } = Select;

// Mock interface - sẽ thay bằng interface thật khi có API
interface Room {
    roomId: string;
    roomName: string;
    description: string;
    address: string;
    price: number;
    status: string;
    createdAt?: string;
    updatedAt?: string;
}

const ManageRoomPage: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const [loading, setLoading] = useState(false);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Filters
    const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
    const [keywordFilter, setKeywordFilter] = useState<string>("");

    // Check authentication
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            message.warning("Vui lòng đăng nhập để quản lý phòng học");
            navigate("/");
        }
    }, [isAuthenticated, authLoading, navigate]);

    // Mock fetch rooms - sẽ thay bằng API call thật
    const fetchRooms = useCallback(async (page: number = currentPage, size: number = pageSize) => {
        if (!isAuthenticated) return;

        setLoading(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 500));

            // Mock data
            const mockRooms: Room[] = [
                {
                    roomId: "1",
                    roomName: "Phòng học A101",
                    description: "Phòng học rộng rãi, đầy đủ tiện nghi",
                    address: "123 Đường ABC, Quận 1, TP.HCM",
                    price: 500000,
                    status: "ACTIVE",
                    createdAt: new Date().toISOString(),
                },
                {
                    roomId: "2",
                    roomName: "Phòng học B202",
                    description: "Phòng học yên tĩnh, có máy lạnh",
                    address: "456 Đường XYZ, Quận 2, TP.HCM",
                    price: 600000,
                    status: "INACTIVE",
                    createdAt: new Date(Date.now() - 86400000).toISOString(),
                },
            ];

            let filteredRooms = [...mockRooms];

            if (statusFilter) {
                filteredRooms = filteredRooms.filter(room => room.status === statusFilter);
            }

            if (keywordFilter) {
                const lowerKeyword = keywordFilter.toLowerCase();
                filteredRooms = filteredRooms.filter(
                    room =>
                        room.roomName.toLowerCase().includes(lowerKeyword) ||
                        room.description.toLowerCase().includes(lowerKeyword) ||
                        room.address.toLowerCase().includes(lowerKeyword)
                );
            }

            const startIndex = (page - 1) * size;
            const endIndex = startIndex + size;
            const paginatedRooms = filteredRooms.slice(startIndex, endIndex);

            setRooms(paginatedRooms);
            setTotal(filteredRooms.length);
            setCurrentPage(page);
            setPageSize(size);
        } catch (error) {
            console.error("Fetch rooms error:", error);
            message.error("Đã xảy ra lỗi khi tải dữ liệu");
            setRooms([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, currentPage, pageSize, statusFilter, keywordFilter]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchRooms(1, 10);
        }
    }, [isAuthenticated, fetchRooms]);

    const handleCreate = () => {
        message.info("Chức năng tạo phòng học sẽ được triển khai");
    };

    const handleEdit = (room: Room) => {
        message.info(`Chỉnh sửa phòng: ${room.roomName}`);
    };

    const handleView = (room: Room) => {
        navigate(`/product/${room.roomId}`);
    };

    const handleDelete = async (roomId: string) => {
        message.info(`Xóa phòng học: ${roomId}`);
        fetchRooms(currentPage, pageSize);
    };

    const handleFilterChange = (key: string, value: string | undefined) => {
        if (key === "status") {
            setStatusFilter(value);
        } else if (key === "keyword") {
            setKeywordFilter(value || "");
        }
        fetchRooms(1, pageSize);
    };

    const handlePageChange = (page: number, size: number) => {
        fetchRooms(page, size);
    };

    const handleRefresh = () => {
        fetchRooms(currentPage, pageSize);
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

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="bg-gray-50 py-4">
            <div className="px-4">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <HomeOutlined className="text-3xl text-[#4da6ff]" />
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800">Quản lý phòng</h1>
                                <p className="text-gray-600 mt-1">Quản lý các phòng học của bạn</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <Card className="mb-6 shadow-sm">
                    <Space size="middle" wrap>
                        <Input
                            placeholder="Tìm kiếm theo tên phòng, mô tả hoặc địa chỉ..."
                            prefix={<SearchOutlined />}
                            value={keywordFilter}
                            onChange={(e) => handleFilterChange("keyword", e.target.value)}
                            onPressEnter={() => handleFilterChange("keyword", keywordFilter)}
                            style={{ width: 300 }}
                            allowClear
                        />
                        <Select
                            placeholder="Lọc theo trạng thái"
                            value={statusFilter}
                            onChange={(value) => handleFilterChange("status", value)}
                            style={{ width: 200 }}
                            allowClear
                        >
                            <Option value="ACTIVE">Đang hoạt động</Option>
                            <Option value="INACTIVE">Ngừng hoạt động</Option>
                            <Option value="MAINTENANCE">Bảo trì</Option>
                        </Select>
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={handleRefresh}
                            loading={loading}
                        >
                            Làm mới
                        </Button>
                    </Space>
                </Card>

                {/* Table */}
                <Card className="shadow-sm">
                    {rooms.length === 0 && !loading ? (
                        <Empty
                            description="Bạn chưa có phòng học nào"
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        >
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={handleCreate}
                            >
                                Thêm phòng học đầu tiên
                            </Button>
                        </Empty>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-4 font-semibold text-gray-700">Tên phòng</th>
                                            <th className="text-left p-4 font-semibold text-gray-700">Mô tả</th>
                                            <th className="text-left p-4 font-semibold text-gray-700">Địa chỉ</th>
                                            <th className="text-left p-4 font-semibold text-gray-700">Giá</th>
                                            <th className="text-left p-4 font-semibold text-gray-700">Trạng thái</th>
                                            <th className="text-left p-4 font-semibold text-gray-700">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rooms.map((room) => (
                                            <tr key={room.roomId} className="border-b hover:bg-gray-50">
                                                <td className="p-4">
                                                    <span className="font-medium text-gray-800">{room.roomName}</span>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-gray-600">{room.description}</span>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-gray-600">{room.address}</span>
                                                </td>
                                                <td className="p-4">
                                                    <span className="font-semibold text-[#4da6ff]">
                                                        {room.price.toLocaleString("vi-VN")} đ
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${room.status === "ACTIVE"
                                                        ? "bg-green-100 text-green-700"
                                                        : room.status === "INACTIVE"
                                                            ? "bg-gray-100 text-gray-700"
                                                            : "bg-yellow-100 text-yellow-700"
                                                        }`}>
                                                        {room.status === "ACTIVE" ? "Đang hoạt động" :
                                                            room.status === "INACTIVE" ? "Ngừng hoạt động" : "Bảo trì"}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <Space>
                                                        <Button size="small" onClick={() => handleView(room)}>
                                                            Xem
                                                        </Button>
                                                        <Button size="small" type="primary" onClick={() => handleEdit(room)}>
                                                            Sửa
                                                        </Button>
                                                        <Button size="small" danger onClick={() => handleDelete(room.roomId)}>
                                                            Xóa
                                                        </Button>
                                                    </Space>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {total > 0 && (
                                <div className="mt-4 flex justify-end">
                                    <Pagination
                                        current={currentPage}
                                        pageSize={pageSize}
                                        total={total}
                                        onChange={handlePageChange}
                                        onShowSizeChange={handlePageChange}
                                        showSizeChanger
                                        showTotal={(total, range) =>
                                            `${range[0]}-${range[1]} của ${total} phòng học`
                                        }
                                        pageSizeOptions={["10", "20", "50", "100"]}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default ManageRoomPage;
