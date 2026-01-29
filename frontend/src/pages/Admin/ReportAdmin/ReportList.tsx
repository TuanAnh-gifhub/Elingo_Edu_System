import { Table } from "antd";
import type { TableProps } from "antd";
import { MoreOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Button, Dropdown, Space } from "antd";
import { useState } from "react";
import { Tag } from "antd";
const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  PENDING: { color: "orange", label: "Chờ xử lý" },
  RESOLVED: { color: "green", label: "Đã xử lý" },
  REJECTED: { color: "red", label: "Từ chối" },
};

interface DataType {
  reportId: string;
  title: string;
  content: string;
  address: string;
  status: string;
  user: {
    email: string;
    phone: string;
  };
}

interface ReportListProps {
  data: DataType[];
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number, pageSize: number) => void;
  onViewDetail: (reportId: string) => void;
  onUpdate: (reportId: string) => void;
}

export default function ReportList({
  data,
  page,
  pageSize,
  total,
  onPageChange,
  onViewDetail,
  onUpdate,
}: ReportListProps) {
  const columns: TableProps<DataType>["columns"] = [
    {
      title: "STT",
      render: (_: any, __: DataType, index: number) =>
        (page - 1) * pageSize + index + 1,
    },
    {
      title: "Tiêu đề",
      dataIndex: "title",
    },
    {
      title: "Nội dung",
      dataIndex: "content",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (status: string) => {
        const config = STATUS_CONFIG[status];

        return config ? (
          <Tag color={config.color}>{config.label}</Tag>
        ) : (
          <Tag>{status}</Tag>
        );
      },
    },
    {
      title: "Address",
      dataIndex: "address",
    },
    {
      title: "Action",
      render: (_, record) => {
        const items: MenuProps["items"] = [
          {
            key: "view",
            label: "Xem chi tiết",
          },
          {
            key: "update",
            label: "Xử lý / phản hồi",
          },
          // {
          //   key: "delete",
          //   label: "Xóa",
          // },
        ];

        return (
          <Dropdown
            trigger={["click"]}
            menu={{
              items,
              onClick: ({ key }) => {
                if (key === "view") {
                  onViewDetail(record.reportId);
                }
                if (key === "update") {
                  onUpdate(record.reportId);
                }
              },
            }}
          >
            <Button icon={<MoreOutlined />} />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <Table<DataType>
      size="small"
      columns={columns}
      dataSource={data}
      rowKey="reportId"
      pagination={{
        current: page,
        pageSize,
        total,
        showSizeChanger: true,
        onChange: onPageChange,
      }}
      bordered
    />
  );
}
