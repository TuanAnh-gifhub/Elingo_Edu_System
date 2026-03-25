import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Typography,
  Tag,
  Modal,
  notification,
  Empty,
  Spin,
} from "antd";
import {
  CheckCircleOutlined,
  DollarCircleOutlined,
  CalendarOutlined,
  RocketOutlined,
} from "@ant-design/icons";
import packageService from "../../../services/package/packageService";
import type { Package } from "../../../services/package/packageService";

const { Title, Paragraph } = Typography;

const SubscriptionPage: React.FC = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const response = await packageService.user.getAllAvailablePackages();
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

  const handlePurchase = async (pkg: Package) => {
    Modal.confirm({
      title: "Xác nhận mua gói cước",
      content: (
        <div className="mt-4">
          <p>
            Bạn có chắc chắn muốn mua gói: <strong>{pkg.name}</strong>?
          </p>
          <div className="flex justify-between items-center text-lg mt-2 font-bold text-blue-600">
            <span>Tổng thanh toán:</span>
            <span>{pkg.price.toLocaleString("vi-VN")} VNĐ</span>
          </div>
          <p className="text-gray-500 text-sm mt-2 italic">
            * Số tiền sẽ được trừ trực tiếp vào ví của bạn.
          </p>
        </div>
      ),
      okText: "Xác nhận thanh toán",
      cancelText: "Hủy",
      width: 450,
      centered: true,
      onOk: async () => {
        setPurchasing(pkg.id);
        try {
          await packageService.user.purchasePackage(pkg.id);
          notification.success({
            message: "Mua gói cước thành công!",
            description: `Chào mừng bạn gia nhập gói ${pkg.name}. Tận hưởng ngay các tính năng cao cấp!`,
            icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
          });
        } catch (error: any) {
          const errMsg = error.response?.data?.message || "Lỗi khi thực hiện giao dịch";
          notification.error({
            message: "Mua gói cước thất bại",
            description: errMsg,
          });
        } finally {
          setPurchasing(null);
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" tip="Đang tải danh sách gói cước..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8 mb-16">
      <div className="text-center mb-16">
        <Title level={1} className="text-4xl font-extrabold mb-4 text-blue-800">
          Nâng tầm trải nghiệm học tập
        </Title>
        <Paragraph className="text-lg text-gray-600 max-w-2xl mx-auto">
          Chọn gói đăng ký phù hợp với mục tiêu của bạn. Mở khóa các bài học độc quyền, 
          tương tác 1:1 với giáo viên và nhận chứng chỉ quốc tế.
        </Paragraph>
      </div>

      {packages.length === 0 ? (
        <Empty description="Hiện chưa có gói cước nào khả dụng" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {packages.map((pkg) => (
            <Card
              key={pkg.id}
              className={`relative overflow-hidden transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl border-2 ${
                 pkg.name.toLowerCase().includes("vip") || pkg.name.toLowerCase().includes("pro")
                  ? "border-blue-500 shadow-blue-100"
                  : "border-gray-100"
              }`}
              bodyStyle={{ padding: "2rem" }}
            >
              {/* Badge for popular packages */}
              {(pkg.name.toLowerCase().includes("vip") || pkg.name.toLowerCase().includes("pro")) && (
                <div className="absolute top-0 right-0 bg-blue-600 text-white px-8 py-1 rotate-45 translate-x-10 translate-y-3 font-semibold text-sm shadow-md">
                  HOT
                </div>
              )}

              <div className="mb-6">
                <Tag color="blue" className="mb-2 px-3 py-0.5 rounded-full font-medium">
                  {pkg.durationInDays} NGÀY
                </Tag>
                <Title level={2} className="mt-2 mb-1 !text-2xl font-bold">
                  {pkg.name}
                </Title>
                <Paragraph className="text-gray-500 min-h-[3rem] line-clamp-2">
                  {pkg.description}
                </Paragraph>
              </div>

              <div className="flex items-baseline mb-8">
                <span className="text-4xl font-bold text-blue-700">
                  {pkg.price.toLocaleString("vi-VN")}
                </span>
                <span className="ml-1 text-gray-500 font-medium">VNĐ</span>
              </div>

              <div className="space-y-4 mb-8">
                {pkg.features?.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircleOutlined className="mt-1 text-blue-500" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              <Button
                type="primary"
                size="large"
                block
                icon={<RocketOutlined />}
                loading={purchasing === pkg.id}
                onClick={() => handlePurchase(pkg)}
                className={`h-14 text-lg font-bold rounded-xl shadow-lg transition-all duration-300 ${
                  pkg.name.toLowerCase().includes("vip")
                    ? "bg-gradient-to-r from-blue-600 to-indigo-700 border-none hover:opacity-90"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                MUA NGAY
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* Benefits Section */}
      <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-12 border-t pt-16 border-gray-100">
        <div className="text-center group">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
            <CalendarOutlined style={{ fontSize: "32px" }} />
          </div>
          <Title level={4}>Dùng thử linh hoạt</Title>
          <Paragraph className="text-gray-500">
            Nhiều gói thời gian phù hợp với nhu cầu trải nghiệm ngắn hạn hoặc dài hạn của bạn.
          </Paragraph>
        </div>
        <div className="text-center group">
          <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-green-600 transition-colors group-hover:bg-green-600 group-hover:text-white">
             <DollarCircleOutlined style={{ fontSize: "32px" }} />
          </div>
          <Title level={4}>Thanh toán an toàn</Title>
          <Paragraph className="text-gray-500">
            Hệ thống ví điện tử minh bạch, bảo mật giúp bạn thực hiện giao dịch chỉ trong vài giây.
          </Paragraph>
        </div>
        <div className="text-center group">
          <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-purple-600 transition-colors group-hover:bg-purple-600 group-hover:text-white">
            <CheckCircleOutlined style={{ fontSize: "32px" }} />
          </div>
          <Title level={4}>Kích hoạt tức thì</Title>
          <Paragraph className="text-gray-500">
            Ngay sau khi thanh toán thành công, toàn bộ tính năng và quyền lợi sẽ được kích hoạt.
          </Paragraph>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
