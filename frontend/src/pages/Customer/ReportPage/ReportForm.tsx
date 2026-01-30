import type { FormProps } from "antd";
import { Button, Col, Form, Input, message, Row, Select } from "antd";
import { useAuth } from "../../../context/AuthContext";

import { useEffect } from "react";

import { reportService } from "../../../services/reportService/reportService";
type FieldReportType = {
  title?: string;
  titleOther?: string;
  content?: string;
  email?: string;
  address?: string;
  roomName?: string;
  reportId?: string;
};

export default function ReportForm() {
  const [form] = Form.useForm<FieldReportType>();
  const [messageApi, contextHolder] = message.useMessage();
  const { user, isAuthenticated } = useAuth();
  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        reportId: user?.userId,
      });
    }
  }, [user, form]);

  const onFinish: FormProps<FieldReportType>["onFinish"] = async (values) => {
    if (!isAuthenticated || !user) {
      messageApi.error("Vui lòng đăng nhập để gửi báo cáo vi phạm.");
      return;
    }

    const payload = {
      title: values.title === "Khác" ? values.titleOther : values.title,
      content: values.content,
      email: values.email,
      address: values.address,
      roomName: values.roomName,
      reportId: values.reportId,
    };

    try {
      const response = await reportService.createReport(payload);

      form.resetFields();
      form.setFieldsValue({
        reportId: user.userId,
      });
      if (response.code === 200) {
        messageApi.success(
          <>
            Báo cáo vi phạm đã được gửi thành công
            <br />
            Chúng tôi sẽ phản hồi email đến bạn trong thời gian sớm nhất!
          </>,
        );
      }
    } catch (error: any) {
      if (error.response?.data.code === 400) {
        type FieldName = keyof FieldReportType;

        const allFields = form.getFieldsValue(true);
        form.setFields(
          (Object.keys(allFields) as FieldName[]).map((name) => ({
            name,
            errors: [],
          })),
        );
        const fieldErrors = Object.entries(error.response.data.result).map(
          ([key, value]) => ({
            name: key,
            errors: [String(value)],
          }),
        );
        form.setFields(fieldErrors);
      }
    }
  };

  return (
    <>
      {contextHolder}

      <div className="bg-blue-50 border border-gray-50 rounded-2xl p-2">
        <h2 className="text-center text-2xl font-extrabold text-gray-800 mb-3">
          Báo cáo vi phạm
        </h2>

        <Row justify="center">
          <Col xs={24} md={18} lg={14} xl={10}>
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              name="reportForm"
              className="border border-gray-200 rounded-lg p-5"
            >
              <div className="space-y-4 p-4 border rounded-lg">
                <Form.Item
                  name="title"
                  label={
                    <span className="font-semibold text-gray-700">Tiêu đề</span>
                  }
                  validateTrigger="onChange"
                >
                  <Select
                    size="large" 
                    placeholder="Lựa chọn tiêu đề báo cáo"
                    allowClear
                    options={[
                      { label: "Chủ nhà giả mạo", value: "Chủ nhà giả mạo" },
                      {
                        label: "Ảnh phòng không đúng thực tế",
                        value: "Ảnh phòng không đúng thực tế",
                      },
                      {
                        label: "Phụ thu chi phí ngoài khi không sử dụng",
                        value: "Phụ thu chi phí ngoài khi không sử dụng",
                      },
                      {
                        label: "Phòng thường xuyên trùng lịch",
                        value: "Phòng thường xuyên trùng lịch",
                      },
                      { label: "Khác", value: "Khác" },
                    ]}
                  />
                </Form.Item>
                <Form.Item noStyle shouldUpdate>
                  {({ getFieldValue }) =>
                    getFieldValue("title") === "Khác" ? (
                      <Form.Item
                        name="titleOther"
                        label={
                          <span className="font-semibold text-gray-700">
                            Tiêu đề khác
                          </span>
                        }
                        className="mt-4"
                      >
                        <Input size="large" />
                      </Form.Item>
                    ) : null
                  }
                </Form.Item>
                <Form.Item
                  label={
                    <span className="font-semibold text-gray-700">
                      Địa chỉ tòa nhà
                    </span>
                  }
                  name="address"
                >
                  <Input size="large" placeholder="Nhập địa chỉ..." />
                </Form.Item>
                <Form.Item
                  label={
                    <span className="font-semibold text-gray-700">
                      Số phòng chi tiết
                    </span>
                  }
                  name="roomName"
                >
                  <Input size="large" placeholder="Ví dụ: Phòng 302" />
                </Form.Item>
                <Form.Item
                  label={
                    <span className="font-semibold text-gray-700">
                      Nội dung chi tiết
                    </span>
                  }
                  name="content"
                >
                  <Input.TextArea
                    rows={4}
                    placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
                  />
                </Form.Item>
                <Form.Item name="reportId" hidden>
                  <Input />
                </Form.Item>
                <div className="pt-4">
                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    size="large"
                    className="h-12 text-base font-bold rounded-lg shadow-lg hover:shadow-blue-200 transition-all"
                  >
                    Gửi báo cáo
                  </Button>
                </div>
              </div>
            </Form>
          </Col>
        </Row>
      </div>
    </>
  );
}
