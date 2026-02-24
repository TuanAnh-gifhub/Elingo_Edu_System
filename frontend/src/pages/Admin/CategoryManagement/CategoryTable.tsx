import React, { useMemo } from "react";
import { Button, Popconfirm, Space, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { CategoryResponse } from "../../../services/categories/categories";

interface CategoryTableProps {
  data: CategoryResponse[];
  loading?: boolean;
  onEdit: (item: CategoryResponse) => void;
  onDelete: (id: number) => void;
}

const CategoryTable: React.FC<CategoryTableProps> = ({
  data,
  loading = false,
  onEdit,
  onDelete,
}) => {
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) =>
      a.categoryName.localeCompare(b.categoryName, "vi", {
        sensitivity: "base",
      }),
    );
  }, [data]);

  const columns: ColumnsType<CategoryResponse> = [
    {
      title: "Loại phòng",
      dataIndex: "categoryName",
      key: "categoryName",
      sorter: (a, b) =>
        a.categoryName.localeCompare(b.categoryName, "vi", {
          sensitivity: "base",
        }),
      defaultSortOrder: "ascend",
      render: (text: string) => <span className="font-medium">{text}</span>,
    },
    {
      title: "Hành động",
      key: "actions",
      width: 180,
      align: "center",
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => onEdit(record)}>
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc muốn xóa?"
            okText="Xóa"
            cancelText="Hủy"
            onConfirm={() => onDelete(record.categoryId)}
          >
            <Button size="small" danger>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table
      rowKey="categoryId"
      columns={columns}
      dataSource={sortedData}
      loading={loading}
      pagination={{ pageSize: 8 }}
    />
  );
};

export default CategoryTable;
