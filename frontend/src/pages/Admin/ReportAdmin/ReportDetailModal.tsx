import { Modal, Descriptions, Card, Tag } from "antd";
import dayjs from "dayjs";

interface ReportDetailModalProps {
  open: boolean;
  onClose: () => void;
  data: any; // sau này thay bằng ReportDetailResponse
}

const statusColorMap: Record<string, string> = {
  PENDING: "orange",
  RESOLVED: "green",
  REJECTED: "red",
};

export default function ReportDetailModal({
  open,
  onClose,
  data,
}: ReportDetailModalProps) {
  return (
    <Modal
      title="Chi tiết báo cáo"
      open={open}
      onCancel={onClose}
      footer={null}
      width={720}
      style={{ top: 24 }}
    >
      {data && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Thông tin báo cáo */}
          <Card title="Thông tin báo cáo" bordered>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Tiêu đề">
                <strong>{data.title}</strong>
              </Descriptions.Item>

              <Descriptions.Item label="Nội dung"></Descriptions.Item>
              <div>{data.content}</div>
              <Descriptions.Item label="Địa chỉ">
                {data.address}
              </Descriptions.Item>

              <Descriptions.Item label="Trạng thái">
                <Tag color={statusColorMap[data.status]}>{data.status}</Tag>
              </Descriptions.Item>

              <Descriptions.Item label="Ngày tạo">
                {dayjs(data.createdAt).format("DD/MM/YYYY HH:mm")}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Người báo cáo */}
          <Card title="Người báo cáo" bordered>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Email">
                {data.user?.email}
              </Descriptions.Item>

              <Descriptions.Item label="Số điện thoại">
                {data.user?.phone}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </div>
      )}
    </Modal>
  );
}
