import React, { useMemo } from "react";
import { Button, Popconfirm, Space, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { AmenityResponse } from "../../../services/amenities/amenities";
import { AMENITY_ICON_MAP, type AmenityIconKey } from "./amenityIcons";

interface AmenityTableProps {
  data: AmenityResponse[];
  loading?: boolean;
  onEdit: (item: AmenityResponse) => void;
  onDelete: (id: number) => void;
}

const AmenityTable: React.FC<AmenityTableProps> = ({
  data,
  loading = false,
  onEdit,
  onDelete,
}) => {
  // 🔹 Sort mặc định A-Z
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) =>
      a.amenityName.localeCompare(b.amenityName, "vi", {
        sensitivity: "base",
      }),
    );
  }, [data]);

  const columns: ColumnsType<AmenityResponse> = [
    {
      title: "Thiết bị & Tiện ích",
      dataIndex: "amenityName",
      key: "amenityName",
      sorter: (a, b) =>
        a.amenityName.localeCompare(b.amenityName, "vi", {
          sensitivity: "base",
        }),
      defaultSortOrder: "ascend",
      render: (text: string) => <span className="font-medium">{text}</span>,
    },
    {
      title: "Biểu tượng",
      dataIndex: "iconKey",
      key: "iconKey",
      width: 150,
      align: "center",
      render: (iconKey: string) => {
        const Icon =
          AMENITY_ICON_MAP[(iconKey as AmenityIconKey) ?? "FaUsers"] ??
          AMENITY_ICON_MAP.FaUsers;

        return <Icon className="text-[#4da6ff] text-lg mx-auto" />;
      },
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
            onConfirm={() => onDelete(record.amenityId)}
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
      rowKey="amenityId"
      columns={columns}
      dataSource={sortedData}
      loading={loading}
      pagination={{ pageSize: 8 }}
    />
  );
};

export default AmenityTable;
