import React from "react";
import { Button, Space, Popconfirm, Dropdown } from "antd";
import type { MenuProps } from "antd";
import { DownOutlined } from "@ant-design/icons";
import type { RentalAreaResponse } from "../../../services/rental-areas/rentalAreas";
import { EditOutlined, DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";

type NextStatus = "ACTIVE" | "INACTIVE";

type Props = {
  data: RentalAreaResponse[];
  onAddRoom: (rentalArea: RentalAreaResponse) => void;

  onToggleStatus: (
    rentalArea: RentalAreaResponse,
    nextStatus: NextStatus,
  ) => void;
  onView?: (rentalArea: RentalAreaResponse) => void;
  onEdit?: (rentalArea: RentalAreaResponse) => void;
  onDelete: (rentalArea: RentalAreaResponse) => void;
};

function statusBadge(status: string) {
  if (status === "ACTIVE") return "bg-green-100 text-green-700";
  if (status === "INACTIVE") return "bg-red-100 text-red-700";
  return "bg-red-100 text-red-700"; // SUSPENDED
}

function statusLabel(status: string) {
  if (status === "ACTIVE") return "Đang hoạt động";
  if (status === "INACTIVE") return "Ngưng hoạt động";
  return "Bị khóa";
}

const RentalAreaTable: React.FC<Props> = ({
  data,
  onAddRoom,
  onToggleStatus,
  onView,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-center p-4 font-semibold text-gray-700">
              Tên tòa nhà
            </th>
            <th className="text-center p-4 font-semibold text-gray-700">
              Địa chỉ
            </th>
            <th className="text-center p-4 font-semibold text-gray-700">
              Liên hệ
            </th>
            <th className="text-center p-4 font-semibold text-gray-700">
              Trạng thái
            </th>
            <th className="text-center p-4 font-semibold text-gray-700">
              Xem chi tiết
            </th>
            <th className="text-center p-4 font-semibold text-gray-700">
              Thao tác
            </th>
          </tr>
        </thead>

        <tbody>
          {data.map((ra) => {
            const contact = [ra.contactName, ra.contactPhone]
              .filter(Boolean)
              .join(" • ");
            const isSuspended = ra.status === "SUSPENDED";
            const nextStatus: NextStatus =
              ra.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

            const statusActionLabel =
              ra.status === "ACTIVE" ? "Ngưng hoạt động" : "Kích hoạt";

            const statusActionClass =
              ra.status === "ACTIVE"
                ? "text-red-600 bg-red-50"
                : "text-green-700 bg-green-50";

            const menuItems: MenuProps["items"] = [
              {
                key: "toggle",
                disabled: isSuspended,
                label: (
                  <Popconfirm
                    title="Xác nhận đổi trạng thái?"
                    description={
                      ra.status === "ACTIVE"
                        ? "Bạn có chắc muốn ngưng hoạt động tòa nhà này?"
                        : "Bạn có chắc muốn kích hoạt lại tòa nhà này?"
                    }
                    okText="Đồng ý"
                    cancelText="Hủy"
                    onConfirm={() => onToggleStatus(ra, nextStatus)}
                  >
                    <div
                      className={`px-2 py-1 rounded text-sm font-medium inline-block ${statusActionClass}`}
                    >
                      {statusActionLabel}
                    </div>
                  </Popconfirm>
                ),
              },
              ...(isSuspended
                ? [
                    {
                      key: "hint",
                      disabled: true,
                      label: (
                        <span className="text-gray-500 text-sm">
                          Tòa nhà đang bị khóa
                        </span>
                      ),
                    },
                  ]
                : []),
            ];

            return (
              <tr key={ra.rentalAreaId} className="border-b hover:bg-gray-50">
                <td className="p-4 align-top">
                  <div className="font-medium text-gray-800 text-center">
                    {ra.rentalAreaName}
                  </div>
                </td>

                <td className="p-4 align-top text-center">
                  <span className="text-gray-600">{ra.address}</span>
                  <div className="text-xs text-gray-500 mt-1">
                    {ra.cityName}
                  </div>
                </td>

                <td className="p-4 align-top text-center">
                  <span className="text-gray-600">{contact || "—"}</span>
                </td>

                {/* Status cell: badge + dropdown action */}
                <td className="p-4 align-top text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${statusBadge(ra.status)}`}
                    >
                      {statusLabel(ra.status)}
                    </span>

                    <Dropdown
                      menu={{ items: menuItems }}
                      trigger={["click"]}
                      placement="bottom"
                    >
                      <Button
                        size="small"
                        type="text"
                        disabled={isSuspended}
                        className="text-gray-600"
                      >
                        Thay đổi <DownOutlined />
                      </Button>
                    </Dropdown>
                  </div>
                </td>

                <td className="p-4 align-top text-center">
                  {onView ? (
                    <Tooltip title="Xem chi tiết">
                      <Button
                        size="small"
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => onView(ra)}
                      />
                    </Tooltip>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>

                <td className="p-4 align-top text-center">
                  <Space size="middle">
                    {/* Thêm phòng học */}
                    <Button size="small" onClick={() => onAddRoom(ra)}>
                      Thêm phòng học
                    </Button>

                    {/* Chỉnh sửa */}
                    {onEdit && (
                      <Tooltip title="Chỉnh sửa thông tin">
                        <Button
                          size="small"
                          type="text"
                          icon={<EditOutlined />}
                          onClick={() => onEdit(ra)}
                        />
                      </Tooltip>
                    )}

                    {/* Xóa */}
                    <Popconfirm
                      title="Xóa tòa nhà?"
                      description="Thao tác này sẽ xóa tòa nhà khỏi danh sách của bạn."
                      okText="Xóa"
                      cancelText="Hủy"
                      okButtonProps={{ danger: true }}
                      onConfirm={() => onDelete(ra)}
                    >
                      <Tooltip title="Xóa tòa nhà">
                        <Button
                          size="small"
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                        />
                      </Tooltip>
                    </Popconfirm>
                  </Space>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default RentalAreaTable;
