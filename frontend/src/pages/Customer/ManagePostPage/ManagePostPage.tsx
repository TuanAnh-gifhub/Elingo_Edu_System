import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, Empty, Pagination, Popconfirm, message } from "antd";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

import postsService, {
  type PostStatus,
  type PostSummaryResponse,
} from "../../../services/posts/posts";

import PageHeader from "./PageHeader";
import PostFilters from "./PostFilters";
import PostCardList from "./PostCardList";
import CreatePostModal from "./CreatePostModal";
import UpdatePostModal from "./UpdatePostModal";

const ManagePostPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<PostSummaryResponse[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);

  // Filters
  const [statusFilter, setStatusFilter] = useState<PostStatus | undefined>(
    undefined,
  );
  const [keywordFilter, setKeywordFilter] = useState("");

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<PostSummaryResponse | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      message.warning("Vui lòng đăng nhập để quản lý tin đăng");
      navigate("/");
    }
  }, [authLoading, isAuthenticated, navigate]);

  const fetchMyPosts = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    try {
      const res = await postsService.getMyPosts(statusFilter);
      setItems(res.result || []);
    } catch (e) {
      console.error(e);
      message.error("Đã xảy ra lỗi khi tải danh sách tin đăng");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, statusFilter]);

  useEffect(() => {
    if (isAuthenticated) fetchMyPosts();
  }, [isAuthenticated, fetchMyPosts]);

  const filtered = useMemo(() => {
    let arr = [...items];

    const k = keywordFilter.trim().toLowerCase();
    if (k) {
      arr = arr.filter(
        (x) =>
          x.title.toLowerCase().includes(k) ||
          (x.roomName || "").toLowerCase().includes(k) ||
          (x.address || "").toLowerCase().includes(k),
      );
    }

    return arr;
  }, [items, keywordFilter]);

  const total = filtered.length;

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, keywordFilter]);

  const handleRefresh = () => fetchMyPosts();

  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  const handleOpenCreate = () => setCreateOpen(true);
  const handleCloseCreate = () => setCreateOpen(false);

  const handleCreated = async () => {
    setCreateOpen(false);
    await fetchMyPosts();
  };

  const handleView = (postId: string) => {
    // Tuỳ bạn: route detail riêng, hoặc drawer (làm sau)
    message.info(
      `Xem chi tiết post: ${postId} (làm tiếp phần drawer/detail sau)`,
    );
  };

  const handleEdit = (item: PostSummaryResponse) => {
    setEditing(item);
    setEditOpen(true);
  };

  const handleCloseEdit = () => {
    setEditOpen(false);
    setEditing(null);
  };

  const handleUpdated = async () => {
    setEditOpen(false);
    setEditing(null);
    await fetchMyPosts();
  };

  const handleDelete = async (item: PostSummaryResponse) => {
    try {
      await postsService.deleteMyPost(item.postId);
      message.success("Xóa tin đăng thành công");
      await fetchMyPosts();
    } catch (e: any) {
      console.error(e);
      message.error(e?.response?.data?.message || "Xóa tin đăng thất bại");
    }
  };

  const handleToggleStatus = async (
    item: PostSummaryResponse,
    next: PostStatus,
  ) => {
    try {
      await postsService.updateMyPostStatus(item.postId, next);
      message.success("Cập nhật trạng thái thành công");
      await fetchMyPosts();
    } catch (e: any) {
      console.error(e);
      message.error(
        e?.response?.data?.message || "Cập nhật trạng thái thất bại",
      );
    }
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

        <PostFilters
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
              description="Bạn chưa có tin đăng nào"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <>
              <PostCardList
                data={paginated}
                loading={loading}
                onView={handleView}
                onEdit={handleEdit}
                onToggleStatus={handleToggleStatus}
                onDelete={(item) => {
                  // confirm ngay trên UI
                  const doDelete = () => handleDelete(item);
                  message.destroy();
                  message.info(
                    <div className="flex items-center gap-3">
                      <span>Bạn chắc chắn muốn xóa tin đăng?</span>
                      <Popconfirm
                        title="Xóa tin đăng"
                        description="Hành động này không thể hoàn tác."
                        okText="Xóa"
                        cancelText="Hủy"
                        onConfirm={doDelete}
                      >
                        <a className="text-red-500">Xóa ngay</a>
                      </Popconfirm>
                    </div>,
                    4,
                  );
                }}
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
                      `${range[0]}-${range[1]} của ${t} tin đăng`
                    }
                    pageSizeOptions={["6", "9", "12", "18"]}
                  />
                </div>
              )}
            </>
          )}
        </Card>

        <CreatePostModal
          open={createOpen}
          onClose={handleCloseCreate}
          onCreated={handleCreated}
        />

        <UpdatePostModal
          open={editOpen}
          initial={editing}
          onClose={handleCloseEdit}
          onUpdated={handleUpdated}
        />
      </div>
    </div>
  );
};

export default ManagePostPage;
