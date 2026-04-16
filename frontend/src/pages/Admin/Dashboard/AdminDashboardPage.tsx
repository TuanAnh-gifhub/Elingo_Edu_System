import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Flex,
  Progress,
  Row,
  Statistic,
  Tag,
  Typography,
} from "antd";
import {
  BookOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  TeamOutlined,
  WalletOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import { classRoomService } from "../../../services/classes/classRoomService";
import type { UserResponse } from "../../../services/usersService";
import { userService } from "../../../services/usersService";
import { walletService } from "../../../services/wallet/walletService";

interface DashboardMetrics {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  pendingWithdrawRequests: number;
}

interface PageEnvelope<T> {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalElements: number;
  data: T[];
}

interface ApiEnvelope<T> {
  code: number;
  message: string;
  result: T;
}

interface UrgentTask {
  key: string;
  title: string;
  description: string;
  priority: "Cao" | "Trung bình";
  actionLabel: string;
  actionPath: string;
}

const initialMetrics: DashboardMetrics = {
  totalStudents: 0,
  totalTeachers: 0,
  totalClasses: 0,
  totalTransactions: 0,
  successfulTransactions: 0,
  failedTransactions: 0,
  pendingWithdrawRequests: 0,
};

const normalizeApiResult = <T,>(raw: unknown): T | null => {
  const payload = raw as { data?: ApiEnvelope<T> } | ApiEnvelope<T>;
  if ((payload as { data?: ApiEnvelope<T> }).data?.result !== undefined) {
    return (payload as { data?: ApiEnvelope<T> }).data?.result ?? null;
  }
  return (payload as ApiEnvelope<T>).result ?? null;
};

const countUserRoles = (users: UserResponse[]) => {
  let totalStudents = 0;
  let totalTeachers = 0;

  users.forEach((user) => {
    const role = (user.role || "").toUpperCase();
    if (role === "STUDENT" || role === "RENTER") totalStudents += 1;
    if (role === "TEACHER" || role === "OWNER") totalTeachers += 1;
  });

  return { totalStudents, totalTeachers };
};

const AdminDashboardPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [metrics, setMetrics] = useState<DashboardMetrics>(initialMetrics);

  const fetchAllUsersForRoleCount = useCallback(async (): Promise<UserResponse[]> => {
    const pageSize = 200;

    const firstResponse = await userService.getAllUsers(1, pageSize);
    const firstPage = normalizeApiResult<PageEnvelope<UserResponse>>(firstResponse);

    if (!firstPage) return [];

    const allUsers = [...(firstPage.data || [])];
    const totalPages = firstPage.totalPages || 1;

    if (totalPages <= 1) return allUsers;

    const pageRequests: Promise<unknown>[] = [];
    for (let page = 2; page <= totalPages; page += 1) {
      pageRequests.push(userService.getAllUsers(page, pageSize));
    }

    const pageResults = await Promise.all(pageRequests);
    pageResults.forEach((result) => {
      const pageData = normalizeApiResult<PageEnvelope<UserResponse>>(result);
      if (pageData?.data?.length) {
        allUsers.push(...pageData.data);
      }
    });

    return allUsers;
  }, []);

  const loadDashboardMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [
        users,
        classResult,
        totalTxResult,
        successTxResult,
        failedTxResult,
        pendingWithdrawResult,
      ] = await Promise.all([
        fetchAllUsersForRoleCount(),
        classRoomService.getClasses(1, 1),
        walletService.getAdminWalletTransactions(1, 1),
        walletService.getAdminWalletTransactions(1, 1, { status: "COMPLETED" }),
        walletService.getAdminWalletTransactions(1, 1, { status: "FAILED" }),
        walletService.getAdminWithdrawRequests(1, 1, "PENDING"),
      ]);

      const roleStats = countUserRoles(users);
      const totalTransactions = Number(totalTxResult.data.result.totalElements ?? 0);
      const successfulTransactions = Number(successTxResult.data.result.totalElements ?? 0);
      const failedTransactions = Number(failedTxResult.data.result.totalElements ?? 0);

      setMetrics({
        totalStudents: roleStats.totalStudents,
        totalTeachers: roleStats.totalTeachers,
        totalClasses: Number(classResult.totalElements ?? 0),
        totalTransactions,
        successfulTransactions,
        failedTransactions,
        pendingWithdrawRequests: Number(
          pendingWithdrawResult.data.result.totalElements ?? 0,
        ),
      });

      setLastUpdated(new Date().toLocaleString("vi-VN"));
    } catch (err) {
      console.error("Dashboard load failed", err);
      setError("Không thể tải đầy đủ dữ liệu dashboard. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [fetchAllUsersForRoleCount]);

  useEffect(() => {
    void loadDashboardMetrics();
  }, [loadDashboardMetrics]);

  const successRate = useMemo(() => {
    if (!metrics.totalTransactions) return 0;
    return Math.round((metrics.successfulTransactions / metrics.totalTransactions) * 100);
  }, [metrics.successfulTransactions, metrics.totalTransactions]);

  const failedRate = useMemo(() => {
    if (!metrics.totalTransactions) return 0;
    return Math.round((metrics.failedTransactions / metrics.totalTransactions) * 100);
  }, [metrics.failedTransactions, metrics.totalTransactions]);

  const healthStatus = useMemo(() => {
    if (failedRate >= 15 || metrics.pendingWithdrawRequests >= 5) {
      return { label: "Rủi ro cao", color: "red" as const };
    }
    if (failedRate >= 8 || metrics.pendingWithdrawRequests > 0) {
      return { label: "Cần theo dõi", color: "gold" as const };
    }
    return { label: "Ổn định", color: "green" as const };
  }, [failedRate, metrics.pendingWithdrawRequests]);

  const urgentTasks: UrgentTask[] = useMemo(() => {
    const tasks: UrgentTask[] = [];

    if (metrics.pendingWithdrawRequests > 0) {
      tasks.push({
        key: "withdraw-requests",
        title: `Có ${metrics.pendingWithdrawRequests} yêu cầu rút tiền chờ duyệt`,
        description: "Cần duyệt sớm để tránh tồn đọng thanh toán cho giáo viên.",
        priority: metrics.pendingWithdrawRequests >= 5 ? "Cao" : "Trung bình",
        actionLabel: "Xử lý rút tiền",
        actionPath: "/admin/transactions",
      });
    }

    if (failedRate >= 15) {
      tasks.push({
        key: "high-failed-rate",
        title: `Tỷ lệ giao dịch thất bại đang ở mức ${failedRate}%`,
        description: "Kiểm tra log thanh toán và các giao dịch lỗi để giảm thất thoát.",
        priority: "Cao",
        actionLabel: "Kiểm tra giao dịch",
        actionPath: "/admin/transaction-history",
      });
    }

    if (metrics.totalTeachers === 0 || metrics.totalStudents === 0) {
      tasks.push({
        key: "missing-user-groups",
        title: "Dữ liệu học sinh/giáo viên đang bất thường",
        description:
          "Một trong hai nhóm người dùng đang bằng 0, cần kiểm tra bộ lọc role hoặc dữ liệu DB.",
        priority: "Trung bình",
        actionLabel: "Kiểm tra người dùng",
        actionPath: "/admin/customers",
      });
    }

    return tasks;
  }, [failedRate, metrics.pendingWithdrawRequests, metrics.totalStudents, metrics.totalTeachers]);

  const priorityColor = (priority: UrgentTask["priority"]) =>
    priority === "Cao" ? "red" : "gold";

  return (
    <div className="space-y-4 p-2 md:p-4">
      <Card>
        <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
          <Flex vertical gap={4}>
            <Typography.Title level={3} style={{ margin: 0 }}>
              Dashboard quản trị Elingo
            </Typography.Title>
            <Typography.Text type="secondary">
              Cập nhật lần cuối: {lastUpdated || "--"}
            </Typography.Text>
          </Flex>

          <Flex align="center" gap={8}>
            <Tag color={healthStatus.color}>{healthStatus.label}</Tag>
            <Button
              icon={<ReloadOutlined />}
              loading={loading}
              onClick={() => void loadDashboardMetrics()}
            >
              Làm mới dữ liệu
            </Button>
          </Flex>
        </Flex>
      </Card>

      {error ? <Alert type="warning" showIcon description={error} /> : null}

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <Card loading={loading}>
            <Statistic
              title="Tổng số học sinh"
              value={metrics.totalStudents}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card loading={loading}>
            <Statistic
              title="Tổng số giáo viên"
              value={metrics.totalTeachers}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card loading={loading}>
            <Statistic
              title="Tổng số lớp học"
              value={metrics.totalClasses}
              prefix={<BookOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card loading={loading}>
            <Statistic
              title="Tổng số giao dịch"
              value={metrics.totalTransactions}
              prefix={<WalletOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card title="Biểu đồ giao dịch tài chính" loading={loading}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Flex vertical align="center" gap={8}>
                  <Typography.Text>Giao dịch thành công</Typography.Text>
                  <Progress type="dashboard" percent={successRate} strokeColor="#16a34a" />
                  <Typography.Text strong>
                    {metrics.successfulTransactions} giao dịch
                  </Typography.Text>
                </Flex>
              </Col>
              <Col xs={24} sm={12}>
                <Flex vertical align="center" gap={8}>
                  <Typography.Text>Giao dịch thất bại</Typography.Text>
                  <Progress type="dashboard" percent={failedRate} strokeColor="#dc2626" />
                  <Typography.Text strong>{metrics.failedTransactions} giao dịch</Typography.Text>
                </Flex>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} xl={10}>
          <Card title="Tỉ lệ xử lý giao dịch" loading={loading}>
            <Flex vertical gap={10}>
              <Typography.Text>Thành công: {successRate}%</Typography.Text>
              <Progress percent={successRate} strokeColor="#16a34a" />

              <Typography.Text>Thất bại: {failedRate}%</Typography.Text>
              <Progress percent={failedRate} strokeColor="#dc2626" />

              <Typography.Text type="secondary">
                Chỉ số thất bại cao thường liên quan đến lỗi cổng thanh toán hoặc giao dịch bị hủy.
              </Typography.Text>
            </Flex>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <Card
            title="Task quan trọng cần xử lý ngay"
            loading={loading}
            extra={<Typography.Text type="secondary">{urgentTasks.length} task</Typography.Text>}
          >
            {urgentTasks.length === 0 ? (
              <Empty description="Hiện chưa có task khẩn cấp." />
            ) : (
              <Flex vertical gap={12}>
                {urgentTasks.map((task) => (
                  <Flex
                    key={task.key}
                    justify="space-between"
                    align="center"
                    gap={12}
                    wrap="wrap"
                    className="rounded-lg border border-gray-200 p-3"
                  >
                    <Flex vertical gap={4}>
                      <Flex align="center" gap={8}>
                        <WarningOutlined style={{ color: "#d97706" }} />
                        <Typography.Text strong>{task.title}</Typography.Text>
                        <Tag color={priorityColor(task.priority)}>{task.priority}</Tag>
                      </Flex>
                      <Typography.Text type="secondary">{task.description}</Typography.Text>
                    </Flex>
                    <Button type="primary">
                      <Link to={task.actionPath}>{task.actionLabel}</Link>
                    </Button>
                  </Flex>
                ))}
              </Flex>
            )}
          </Card>
        </Col>

        <Col xs={24} xl={8}>
          <Card title="Trung tâm điều khiển" loading={loading}>
            <Flex vertical gap={10}>
              <Button block icon={<WalletOutlined />}>
                <Link to="/admin/transactions">Xử lý rút tiền</Link>
              </Button>
              <Button block icon={<WalletOutlined />}>
                <Link to="/admin/transaction-history">Giám sát giao dịch</Link>
              </Button>
              <Button block icon={<ExclamationCircleOutlined />}>
                <Link to="/admin/teacher-verification">Duyệt xác minh giáo viên</Link>
              </Button>
              <Button block icon={<TeamOutlined />}>
                <Link to="/admin/customers">Quản lý người dùng</Link>
              </Button>
              <Button block icon={<BookOutlined />}>
                <Link to="/admin/classes">Quản lý lớp học</Link>
              </Button>
            </Flex>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboardPage;

