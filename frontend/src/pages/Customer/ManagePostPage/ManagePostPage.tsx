import React, { useState, useEffect, useCallback } from "react";
import { Card, Button, Input, Select, Space, message, Empty } from "antd";
import {
  ReloadOutlined,
  SearchOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { postService, type Post } from "../../../services/postService";

const { Option } = Select;

const ManagePostPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined,
  );
  const [keywordFilter, setKeywordFilter] = useState<string>("");

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      message.warning("Vui lòng đăng nhập để quản lý tin đăng");
      navigate("/");
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Fetch posts
  const fetchPosts = useCallback(
    async (page: number = currentPage, size: number = pageSize) => {
      if (!isAuthenticated) return;

      setLoading(true);
      try {
        const response = await postService.getMyPosts(
          page,
          size,
          statusFilter,
          keywordFilter || undefined,
        );

        const actualResponse = response.data;

        if (actualResponse && actualResponse.code === 200) {
          const pageData = actualResponse.result;
          setPosts(pageData.data || []);
          setCurrentPage(page);
          setPageSize(size);
        } else {
          message.error(
            actualResponse?.message || "Lấy danh sách tin đăng thất bại",
          );
          setPosts([]);
        }
      } catch (error) {
        console.error("Fetch posts error:", error);
        message.error("Đã xảy ra lỗi khi tải dữ liệu");
        setPosts([]);
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, currentPage, pageSize, statusFilter, keywordFilter],
  );

  useEffect(() => {
    if (isAuthenticated) {
      fetchPosts(1, 10);
    }
  }, [isAuthenticated, fetchPosts]);

  const handleFilterChange = (key: string, value: string | undefined) => {
    if (key === "status") {
      setStatusFilter(value);
    } else if (key === "keyword") {
      setKeywordFilter(value || "");
    }
    fetchPosts(1, pageSize);
  };

  const handleRefresh = () => {
    fetchPosts(currentPage, pageSize);
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
              <FileTextOutlined className="text-3xl text-[#4da6ff]" />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Quản lý tin đăng
                </h1>
                <p className="text-gray-600 mt-1">
                  Quản lý các tin đăng phòng học của bạn
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6 shadow-sm">
          <Space size="middle" wrap>
            <Input
              placeholder="Tìm kiếm theo tiêu đề hoặc nội dung..."
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
              <Option value="PENDING">Chờ duyệt</Option>
              <Option value="APPROVED">Đã duyệt</Option>
              <Option value="REJECTED">Đã từ chối</Option>
              <Option value="DRAFT">Bản nháp</Option>
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
          {posts.length === 0 && !loading ? (
            <Empty
              description="Bạn chưa có tin đăng nào"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : null}
        </Card>
      </div>
    </div>
  );
};

export default ManagePostPage;
