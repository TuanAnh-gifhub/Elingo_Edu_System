import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Space,
  Tag,
  notification,
  Popconfirm,
  Card,
  Typography,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import packageService from "../../../services/package/packageService";
import type { Package, CreatePackageRequest } from "../../../services/package/packageService";

const { Title } = Typography;

const PackageManagementPage: React.FC = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [form] = Form.useForm();

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const response = await packageService.admin.getAllPackages();
      // Giả sử API trả về mảng trực tiếp hoặc có trường data/result
      setPackages(Array.isArray(response) ? response : response.result || []);
    } catch (error) {
      notification.error({ message: "Lỗi khi tải danh sách gói cước" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleCreateOrUpdate = async (values: any) => {
    try {
      // Ép kiểu features từ string (ngăn cách bởi dấu phẩy) thành mảng nếu cần
      const data: CreatePackageRequest = {
        ...values,
        features: Array.isArray(values.features) 
          ? values.features 
          : values.features.split(",").map((f: string) => f.trim()).filter((f: string) => f !== ""),
      };

      if (editingPackage) {
        await packageService.admin.updatePackage(editingPackage.id, data);
        notification.success({ message: "Cập nhật gói cước thành công" });
      } else {
        await packageService.admin.createPackage(data);
        notification.success({ message: "Tạo gói cước thành công" });
      }
      setIsModalVisible(false);
      form.resetFields();
      setEditingPackage(null);
      fetchPackages();
    } catch (error) {
      notification.error({ message: "Lỗi khi xử lý gói cước" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await packageService.admin.deletePackage(id);
      notification.success({ message: "Xóa gói cước thành công" });
      fetchPackages();
    } catch (error) {
      notification.error({ message: "Lỗi khi xóa gói cước" });
    }
  };

  const showModal = (record?: Package) => {
    if (record) {
      setEditingPackage(record);
      form.setFieldsValue({
        ...record,
        features: record.features.join(", "),
      });
    } else {
      setEditingPackage(null);
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const columns = [
    {
      title: "Tên gói",
      dataIndex: "name",
      key: "name",
      render: (text: string) => <span className="font-semibold text-blue-600">{text}</span>,
    },
    {
      title: "Giá",
      dataIndex: "price",
      key: "price",
      render: (price: number) => (
        <span className="text-green-600 font-bold">
          {price.toLocaleString("vi-VN")} VNĐ
        </span>
      ),
    },
    {
      title: "Thời hạn (Ngày)",
      dataIndex: "durationInDays",
      key: "durationInDays",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={status === "ACTIVE" ? "green" : "red"}>
          {status === "ACTIVE" ? "Đang hoạt động" : "Ngừng hoạt động"}
        </Tag>
      ),
    },
    {
      title: "Tính năng",
      dataIndex: "features",
      key: "features",
      render: (features: string[]) => (
        <div className="flex flex-wrap gap-1">
          {features?.map((f, i) => (
            <Tag key={i} color="blue">
              {f}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_: any, record: Package) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => showModal(record)}
            ghost
          />
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa gói cước này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button type="primary" danger icon={<DeleteOutlined />} ghost />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card className="shadow-sm border-0">
        <div className="flex justify-between items-center mb-6">
          <Title level={3}>Quản lý gói cước</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => showModal()}
            className="rounded-lg h-11 px-6 shadow-md"
          >
            Thêm gói cước mới
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={packages}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          className="custom-table"
        />
      </Card>

      <Modal
        title={editingPackage ? "Chỉnh sửa gói cước" : "Tạo gói cước mới"}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingPackage(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateOrUpdate}
          initialValues={{ status: "ACTIVE" }}
        >
          <Form.Item
            name="name"
            label="Tên gói"
            rules={[{ required: true, message: "Vui lòng nhập tên gói!" }]}
          >
            <Input placeholder="Ví dụ: Gói học viên VIP" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
          >
            <Input.TextArea rows={3} placeholder="Mô tả về gói cước..." />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="price"
              label="Giá (VNĐ)"
              rules={[{ required: true, message: "Vui lòng nhập giá!" }]}
            >
              <InputNumber
                className="w-full"
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                parser={(value: any) => (value as string).replace(/\$\s?|(,*)/g, "") as any}
                min={0}
              />
            </Form.Item>

            <Form.Item
              name="durationInDays"
              label="Thời hạn (Số ngày)"
              rules={[{ required: true, message: "Vui lòng nhập thời hạn!" }]}
            >
              <InputNumber className="w-full" min={1} />
            </Form.Item>
          </div>

          <Form.Item
            name="features"
            label="Tính năng (Ngăn cách bởi dấu phẩy)"
            rules={[{ required: true, message: "Vui lòng nhập ít nhất một tính năng!" }]}
          >
            <Input placeholder="Phòng học VIP, Chat 1:1, Tài liệu PDF..." />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={() => setIsModalVisible(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={loading} className="px-6">
              {editingPackage ? "Cập nhật" : "Tạo mới"}
            </Button>
          </div>
        </Form>
      </Modal>

      <style>{`
        .custom-table .ant-table-thead > tr > th {
          background-color: #f8fafc;
          border-bottom: 2px solid #e2e8f0;
          color: #475569;
          font-weight: 600;
        }
        .custom-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f1f5f9;
        }
        .custom-table .ant-table-tbody > tr:hover > td {
          background-color: #f1f5f9 !important;
        }
      `}</style>
    </div>
  );
};

export default PackageManagementPage;
