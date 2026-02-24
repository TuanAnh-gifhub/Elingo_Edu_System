import React from "react";
import { Button, Card, Dropdown, Tag, Typography } from "antd";
import type { MenuProps } from "antd";
import { EllipsisOutlined } from "@ant-design/icons";
import type {
  PostSummaryResponse,
  PostStatus,
} from "../../../services/posts/posts";

const { Text } = Typography;

type Props = {
  data: PostSummaryResponse[];
  loading?: boolean;

  onView: (postId: string) => void;
  onEdit: (item: PostSummaryResponse) => void;
  onDelete: (item: PostSummaryResponse) => void;
  onToggleStatus: (item: PostSummaryResponse, next: PostStatus) => void;
};

const statusTag = (s: PostStatus) => {
  switch (s) {
    case "PENDING":
      return <Tag color="gold">Chờ duyệt</Tag>;
    case "PUBLISHED":
      return <Tag color="green">Đã đăng</Tag>;
    case "HIDDEN":
      return <Tag>Đang ẩn</Tag>;
    case "DELETED":
      return <Tag color="red">Đã xóa</Tag>;
    default:
      return <Tag>{s}</Tag>;
  }
};

const PostCardList: React.FC<Props> = ({
  data,
  loading = false,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {data.map((p) => {
        const cover =
          p.roomCoverImageUrl || p.rentalAreaCoverImageUrl || undefined;

        const canHide = p.postStatus === "PUBLISHED";
        const canShow = p.postStatus === "HIDDEN";

        const items: MenuProps["items"] = [
          {
            key: "view",
            label: "Xem chi tiết",
            onClick: () => onView(p.postId),
          },
          {
            key: "edit",
            label: "Chỉnh sửa",
            onClick: () => onEdit(p),
          },
          ...(canHide
            ? [
                {
                  key: "hide",
                  label: "Ẩn bài",
                  onClick: () => onToggleStatus(p, "HIDDEN"),
                },
              ]
            : []),
          ...(canShow
            ? [
                {
                  key: "show",
                  label: "Hiện bài",
                  onClick: () => onToggleStatus(p, "PUBLISHED"),
                },
              ]
            : []),
          {
            key: "delete",
            label: <span className="text-red-500">Xóa</span>,
            onClick: () => onDelete(p),
          },
        ];

        return (
          <Card
            key={p.postId}
            loading={loading}
            className="shadow-sm"
            cover={
              cover ? (
                <div className="h-44 w-full overflow-hidden bg-gray-100">
                  <img
                    src={cover}
                    alt={p.title}
                    className="h-44 w-full object-cover"
                  />
                </div>
              ) : null
            }
            actions={[
              <Button type="link" onClick={() => onView(p.postId)} key="view">
                Xem
              </Button>,
              <Button type="link" onClick={() => onEdit(p)} key="edit">
                Sửa
              </Button>,
              <Dropdown menu={{ items }} trigger={["click"]} key="more">
                <Button type="text" icon={<EllipsisOutlined />} />
              </Dropdown>,
            ]}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold text-gray-800 line-clamp-2">
                  {p.title}
                </div>
                <div className="mt-1 text-gray-600">
                  <Text className="text-gray-600">
                    {p.roomName} • {p.rentalAreaName}
                  </Text>
                </div>
                <div className="mt-1 text-gray-500 text-sm line-clamp-1">
                  {p.address}
                </div>
              </div>
              <div className="shrink-0">{statusTag(p.postStatus)}</div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-sm text-gray-600">
              {p.price != null ? <span>Giá: {p.price}</span> : null}
              {p.capacity != null ? (
                <span>• Sức chứa: {p.capacity}</span>
              ) : null}
              {p.area != null ? <span>• Diện tích: {p.area} m²</span> : null}
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default PostCardList;
