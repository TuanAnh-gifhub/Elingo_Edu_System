import {
  Modal,
  Descriptions,
  Card,
  Tag,
  Select,
  Input,
  Button,
  message,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { reportService } from "../../../services/reportService/reportService";

const { TextArea } = Input;

const statusOptions = [
  { value: "RESOLVED", label: "Đã xử lý", color: "green" },
  { value: "REJECTED", label: "Từ chối", color: "red" },
];

const statusColorMap: Record<string, string> = {
  PENDING: "orange",
  RESOLVED: "green",
  REJECTED: "red",
};

interface ReportUpdateModalProps {
  open: boolean;
  onClose: () => void;
  data: any;
  onSuccess: () => void;
}

export default function ReportUpdateModal({
  open,
  onClose,
  data,
  onSuccess,
}: ReportUpdateModalProps) {
  const [status, setStatus] = useState<string>();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (open && data) {
      setStatus(undefined);
      setContent("");
    }
  }, [open, data]);

  const handleSubmit = async () => {
    // if (!status || !content.trim()) {
    //   messageApi.warning("Vui lòng chọn trạng thái và nhập nội dung phản hồi");
    //   return;
    // }

    try {
      setLoading(true);
      await reportService.updateReport(data.reportId, {
        reportStatus: status,
        userName: data.user?.userName || "Bạn",
        email: data.user?.email,
        content,
      });

      messageApi.success("Cập nhật report & gửi phản hồi thành công");
      onSuccess();
      onClose();
    } catch {
      messageApi.error("Cập nhật report thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {contextHolder}

      <Modal
        title=" Xử lý & phản hồi báo cáo"
        open={open}
        onCancel={onClose}
        width={760}
        style={{ top: 24 }}
        bodyStyle={{
          maxHeight: "70vh",
          overflowY: "auto",
        }}
        footer={
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
            }}
          >
            <Button onClick={onClose}>Huỷ</Button>
            <Button
              type="primary"
              loading={loading}
              onClick={handleSubmit}
              // disabled={!status || !content}
            >
              Cập nhật & gửi phản hồi
            </Button>
          </div>
        }
      >
        {data && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Card style={{ flex: 1 }} title="Thông tin báo cáo">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Tiêu đề">
                  <strong>{data.title}</strong>
                </Descriptions.Item>

                <Descriptions.Item label="Nội dung">
                  {data.content}
                </Descriptions.Item>

                <Descriptions.Item label="Địa chỉ">
                  {data.address}
                </Descriptions.Item>

                <Descriptions.Item label="Email người dùng">
                  <span style={{ color: "#1677ff" }}>
                    {data.user?.email || "—"}
                  </span>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="Phản hồi người dùng">
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 500,
                      marginBottom: 6,
                    }}
                  >
                    Trạng thái xử lý
                  </div>

                  <Select
                    style={{ width: "100%" }}
                    placeholder="Chọn trạng thái"
                    value={status}
                    onChange={setStatus}
                  >
                    {statusOptions.map((s) => (
                      <Select.Option key={s.value} value={s.value}>
                        <Tag color={s.color}>{s.label}</Tag>
                      </Select.Option>
                    ))}
                  </Select>
                </div>

                <div>
                  <div
                    style={{
                      fontWeight: 500,
                      marginBottom: 6,
                    }}
                  >
                    Nội dung phản hồi (gửi email)
                  </div>

                  <TextArea
                    rows={4}
                    placeholder="Nhập nội dung phản hồi cho người báo cáo..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </div>
              </div>
            </Card>
          </div>
        )}
      </Modal>
    </>
  );
}
