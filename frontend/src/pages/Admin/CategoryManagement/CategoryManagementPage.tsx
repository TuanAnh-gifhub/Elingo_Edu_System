import React, { useEffect, useMemo, useState } from "react";
import { Button, Input, message } from "antd";
import categoriesService, {
  type CategoryResponse,
  type CreateCategoryRequest,
  type UpdateCategoryRequest,
} from "../../../services/categories/categories";
import CategoryTable from "./CategoryTable";
import CategoryFormModal from "./CategoryFormModal";

const CategoryManagementPage: React.FC = () => {
  const [data, setData] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const [keyword, setKeyword] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<CategoryResponse | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    if (!k) return data;
    return data.filter((x) => x.categoryName.toLowerCase().includes(k));
  }, [data, keyword]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await categoriesService.getAllCategories();
      setData(res.result || []);
    } catch (e: any) {
      message.error(
        e?.response?.data?.message || "Lỗi tải danh sách loại phòng",
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

  const openEdit = (item: CategoryResponse) => {
    setModalMode("edit");
    setEditing(item);
    setModalOpen(true);
  };

  const handleSubmit = async (
    payload: CreateCategoryRequest | UpdateCategoryRequest,
  ) => {
    try {
      setSubmitLoading(true);

      if (modalMode === "create") {
        await categoriesService.createCategory(
          payload as CreateCategoryRequest,
        );
        message.success("Tạo loại phòng thành công");
      } else {
        if (!editing) return;
        await categoriesService.updateCategory(
          editing.categoryId,
          payload as UpdateCategoryRequest,
        );
        message.success("Cập nhật loại phòng thành công");
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
      await categoriesService.deleteCategory(id);
      message.success("Xóa loại phòng thành công");
      await fetchData();
    } catch (e: any) {
      message.error(e?.response?.data?.message || "Xóa thất bại");
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h1 className="text-2xl font-bold" style={{ color: "inherit" }}>
          Quản lý Loại phòng
        </h1>

        <div className="flex items-center gap-2">
          <Input
            placeholder="Tìm theo tên loại phòng..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-[260px]"
          />
          <Button type="primary" onClick={openCreate}>
            + Thêm loại phòng
          </Button>
        </div>
      </div>

      <CategoryTable
        data={filtered}
        loading={loading}
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      <CategoryFormModal
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

export default CategoryManagementPage;
