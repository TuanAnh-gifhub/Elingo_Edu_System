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
  Segmented,
  Tag,
  Tooltip,
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
import type {
  AdminDepositTrendResultResponse,
  AdminPlatformIncomeTrendResponse,
} from "../../../services/wallet/walletService";

interface DashboardMetrics {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalDeposits: number;
  completedDeposits: number;
  failedDeposits: number;
  pendingDeposits: number;
  cancelledDeposits: number;
  totalSubscriptionIncome: number;
  totalCommissionIncome: number;
  totalPlatformIncome: number;
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

const HIDDEN_TASKS_STORAGE_KEY = "admin_dashboard_hidden_urgent_tasks";

const initialMetrics: DashboardMetrics = {
  totalStudents: 0,
  totalTeachers: 0,
  totalClasses: 0,
  totalDeposits: 0,
  completedDeposits: 0,
  failedDeposits: 0,
  pendingDeposits: 0,
  cancelledDeposits: 0,
  totalSubscriptionIncome: 0,
  totalCommissionIncome: 0,
  totalPlatformIncome: 0,
};

const formatCurrency = (value?: number) =>
  Number(value || 0).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });

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

type TrendGranularity = "day" | "month";

type ChartRow = {
  period: string;
  value: number;
};

type SingleSeriesColumnChartProps = {
  rows: ChartRow[];
  seriesLabel: string;
  barClassName?: string;
  formatValue?: (value: number) => string;
};

const SingleSeriesColumnChart: React.FC<SingleSeriesColumnChartProps> = ({
  rows,
  seriesLabel,
  barClassName,
  formatValue,
}) => {
  if (!rows.length) {
    return <Empty description="Chưa có dữ liệu" />;
  }

  const maxValue = Math.max(...rows.map((item) => item.value), 1);
  const renderValue = formatValue ?? ((value: number) => value.toLocaleString("vi-VN"));
  const vibrantBarClassNames = [
    "bg-gradient-to-t from-rose-600 to-pink-400",
    "bg-gradient-to-t from-orange-600 to-amber-400",
    "bg-gradient-to-t from-fuchsia-600 to-violet-400",
    "bg-gradient-to-t from-sky-600 to-cyan-400",
    "bg-gradient-to-t from-emerald-600 to-lime-400",
    "bg-gradient-to-t from-indigo-600 to-blue-400",
  ];
  const [animateBars, setAnimateBars] = useState(false);

  useEffect(() => {
    setAnimateBars(false);
    const timer = window.setTimeout(() => setAnimateBars(true), 40);
    return () => window.clearTimeout(timer);
  }, [rows]);

  return (
    <div className="space-y-3">
      <Flex gap={16} wrap="wrap">
        <Flex align="center" gap={8}>
          <span className="h-3 w-3 rounded bg-blue-500" />
          <Typography.Text type="secondary">{seriesLabel}</Typography.Text>
        </Flex>
      </Flex>

      <div className="overflow-x-auto pb-2">
        <div className="min-w-[760px] rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="h-[360px]">
            <div className="flex h-full items-end gap-3 border-b-2 border-slate-700 px-2 pb-6">
              {rows.map((row) => {
                const percent = Math.max((row.value / maxValue) * 100, row.value > 0 ? 4 : 0);
                const colorClass =
                  barClassName ||
                  vibrantBarClassNames[
                    rows.findIndex((item) => item.period === row.period) % vibrantBarClassNames.length
                  ];
                return (
                  <div key={row.period} className="flex min-w-[72px] flex-1 flex-col items-center justify-end">
                    <Typography.Text className="mb-1 text-xs font-semibold text-blue-700">
                      {renderValue(row.value)}
                    </Typography.Text>
                    <div className="flex h-[280px] w-full items-end justify-center">
                      <Tooltip
                        title={`${row.period} | ${seriesLabel}: ${renderValue(row.value)}`}
                        color="#111827"
                      >
                        <div
                          className={`w-11 cursor-pointer rounded-t-md shadow-md transition-all duration-500 ease-out hover:scale-105 hover:shadow-xl ${colorClass}`}
                          style={{
                            height: animateBars ? `${percent}%` : "0%",
                          }}
                        />
                      </Tooltip>
                    </div>
                    <Typography.Text className="mt-2 text-xs font-medium text-slate-700">
                      {row.period}
                    </Typography.Text>
                  </div>
                );
              })}
            </div>
            <div className="mt-1 flex justify-end">
              <Typography.Text type="secondary" className="text-xs italic">
                Moc
              </Typography.Text>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminDashboardPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [metrics, setMetrics] = useState<DashboardMetrics>(initialMetrics);
  const [incomeTrend, setIncomeTrend] = useState<AdminPlatformIncomeTrendResponse | null>(null);
  const [depositTrend, setDepositTrend] = useState<AdminDepositTrendResultResponse | null>(null);
  const [trendGranularity, setTrendGranularity] = useState<TrendGranularity>("day");
  const [incomeMetric, setIncomeMetric] = useState<"total" | "subscription" | "commission">("total");
  const [depositMetric, setDepositMetric] = useState<"amount" | "users">("amount");
  const [hiddenTaskKeys, setHiddenTaskKeys] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(HIDDEN_TASKS_STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
      return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
    } catch {
      return [];
    }
  });

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
        totalDepositResult,
        completedDepositResult,
        failedDepositResult,
        pendingDepositResult,
        cancelledDepositResult,
        incomeTrendResult,
        depositTrendResult,
      ] = await Promise.all([
        fetchAllUsersForRoleCount(),
        classRoomService.getClasses(1, 1),
        walletService.getAdminWalletTransactions(1, 1, { type: "DEPOSIT" }),
        walletService.getAdminWalletTransactions(1, 1, {
          type: "DEPOSIT",
          status: "COMPLETED",
        }),
        walletService.getAdminWalletTransactions(1, 1, {
          type: "DEPOSIT",
          status: "FAILED",
        }),
        walletService.getAdminWalletTransactions(1, 1, {
          type: "DEPOSIT",
          status: "PENDING",
        }),
        walletService.getAdminWalletTransactions(1, 1, {
          type: "DEPOSIT",
          status: "CANCELLED",
        }),
        walletService.getAdminPlatformIncomeTrend(),
        walletService.getAdminDepositTrend(),
      ]);

      const roleStats = countUserRoles(users);
      const totalDeposits = Number(totalDepositResult.data.result.totalElements ?? 0);
      const completedDeposits = Number(completedDepositResult.data.result.totalElements ?? 0);
      const failedDeposits = Number(failedDepositResult.data.result.totalElements ?? 0);
      const pendingDeposits = Number(pendingDepositResult.data.result.totalElements ?? 0);
      const cancelledDeposits = Number(cancelledDepositResult.data.result.totalElements ?? 0);
      const trend = incomeTrendResult.data.result;
      const deposit = depositTrendResult.data.result;

      setMetrics({
        totalStudents: roleStats.totalStudents,
        totalTeachers: roleStats.totalTeachers,
        totalClasses: Number(classResult.totalElements ?? 0),
        totalDeposits,
        completedDeposits,
        failedDeposits,
        pendingDeposits,
        cancelledDeposits,
        totalSubscriptionIncome: Number(trend.totalSubscriptionIncome ?? 0),
        totalCommissionIncome: Number(trend.totalCommissionIncome ?? 0),
        totalPlatformIncome: Number(trend.totalIncome ?? 0),
      });
      setIncomeTrend(trend);
      setDepositTrend(deposit);

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
    if (!metrics.totalDeposits) return 0;
    return Math.round((metrics.completedDeposits / metrics.totalDeposits) * 100);
  }, [metrics.completedDeposits, metrics.totalDeposits]);

  const failedRate = useMemo(() => {
    if (!metrics.totalDeposits) return 0;
    return Math.round((metrics.failedDeposits / metrics.totalDeposits) * 100);
  }, [metrics.failedDeposits, metrics.totalDeposits]);

  const healthStatus = useMemo(() => {
    if (failedRate >= 15 || metrics.pendingDeposits >= 5) {
      return { label: "Rủi ro cao", color: "red" as const };
    }
    if (failedRate >= 8 || metrics.pendingDeposits > 0) {
      return { label: "Cần theo dõi", color: "gold" as const };
    }
    return { label: "Ổn định", color: "green" as const };
  }, [failedRate, metrics.pendingDeposits]);

  const urgentTasks: UrgentTask[] = useMemo(() => {
    const tasks: UrgentTask[] = [];

    if (metrics.pendingDeposits > 0) {
      tasks.push({
        key: "pending-deposit-requests",
        title: `Có ${metrics.pendingDeposits} yêu cầu nạp tiền đang xử lý`,
        description: "Theo dõi để đảm bảo callback thanh toán được cập nhật kịp thời.",
        priority: metrics.pendingDeposits >= 5 ? "Cao" : "Trung bình",
        actionLabel: "Kiểm tra nạp tiền",
        actionPath: "/admin/transaction-history",
      });
    }

    if (failedRate >= 15) {
      tasks.push({
        key: "high-failed-rate",
        title: `Tỷ lệ nạp tiền thất bại đang ở mức ${failedRate}%`,
        description: "Kiểm tra log thanh toán và các yêu cầu nạp tiền lỗi để giảm thất thoát.",
        priority: "Cao",
        actionLabel: "Kiểm tra nạp tiền",
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
  }, [failedRate, metrics.pendingDeposits, metrics.totalStudents, metrics.totalTeachers]);

  useEffect(() => {
    window.localStorage.setItem(HIDDEN_TASKS_STORAGE_KEY, JSON.stringify(hiddenTaskKeys));
  }, [hiddenTaskKeys]);

  const visibleUrgentTasks = useMemo(
    () => urgentTasks.filter((task) => !hiddenTaskKeys.includes(task.key)),
    [urgentTasks, hiddenTaskKeys],
  );

  const hideTask = (taskKey: string) => {
    setHiddenTaskKeys((prev) => (prev.includes(taskKey) ? prev : [...prev, taskKey]));
  };

  const restoreHiddenTasks = () => {
    setHiddenTaskKeys([]);
  };

  const priorityColor = (priority: UrgentTask["priority"]) =>
    priority === "Cao" ? "red" : "gold";

  const incomeChartRows = useMemo<ChartRow[]>(() => {
    const source = trendGranularity === "day" ? incomeTrend?.daily : incomeTrend?.monthly;
    return (source || []).map((item) => ({
      period: item.period,
      value:
        incomeMetric === "subscription"
          ? Number(item.subscriptionIncome || 0)
          : incomeMetric === "commission"
            ? Number(item.commissionIncome || 0)
            : Number(item.totalIncome || 0),
    }));
  }, [incomeMetric, incomeTrend, trendGranularity]);

  const depositChartRows = useMemo<ChartRow[]>(() => {
    const source = trendGranularity === "day" ? depositTrend?.daily : depositTrend?.monthly;
    return (source || []).map((item) => ({
      period: item.period,
      value:
        depositMetric === "users"
          ? Number(item.depositingUsers || 0)
          : Number(item.totalAmount || 0),
    }));
  }, [depositMetric, depositTrend, trendGranularity]);

  const incomeSeriesLabel =
    incomeMetric === "subscription"
      ? "Thu tu mua goi"
      : incomeMetric === "commission"
        ? "Thu tu hoa hong"
        : "Tong thu nhap";

  const depositSeriesLabel =
    depositMetric === "users" ? "So nguoi nap vi" : "Tong so tien nap";

  const dashboardMetricCards = [
    {
      key: "students",
      title: "Tổng số học sinh",
      value: String(metrics.totalStudents),
      icon: <TeamOutlined />,
      bgClass: "from-blue-50 via-cyan-50 to-sky-100",
      borderClass: "border-blue-200/70",
      iconClass: "bg-blue-500 text-white",
    },
    {
      key: "teachers",
      title: "Tổng số giáo viên",
      value: String(metrics.totalTeachers),
      icon: <TeamOutlined />,
      bgClass: "from-violet-50 via-purple-50 to-fuchsia-100",
      borderClass: "border-violet-200/70",
      iconClass: "bg-violet-500 text-white",
    },
    {
      key: "classes",
      title: "Tổng số lớp học",
      value: String(metrics.totalClasses),
      icon: <BookOutlined />,
      bgClass: "from-emerald-50 via-teal-50 to-cyan-100",
      borderClass: "border-emerald-200/70",
      iconClass: "bg-emerald-500 text-white",
    },
    {
      key: "subscriptionIncome",
      title: "Thu nhập từ mua gói",
      value: formatCurrency(metrics.totalSubscriptionIncome),
      icon: <WalletOutlined />,
      bgClass: "from-amber-50 via-orange-50 to-yellow-100",
      borderClass: "border-amber-200/70",
      iconClass: "bg-orange-500 text-white",
    },
    {
      key: "commissionIncome",
      title: "Thu nhập từ hoa hồng",
      value: formatCurrency(metrics.totalCommissionIncome),
      icon: <WalletOutlined />,
      bgClass: "from-pink-50 via-rose-50 to-red-100",
      borderClass: "border-pink-200/70",
      iconClass: "bg-rose-500 text-white",
    },
    {
      key: "totalPlatformIncome",
      title: "Tổng thu nhập nền tảng",
      value: formatCurrency(metrics.totalPlatformIncome),
      icon: <WalletOutlined />,
      bgClass: "from-indigo-50 via-blue-50 to-cyan-100",
      borderClass: "border-indigo-200/70",
      iconClass: "bg-indigo-500 text-white",
    },
    {
      key: "totalDeposits",
      title: "Tổng yêu cầu nạp tiền",
      value: String(metrics.totalDeposits),
      icon: <WalletOutlined />,
      bgClass: "from-slate-50 via-zinc-50 to-stone-100",
      borderClass: "border-slate-200/80",
      iconClass: "bg-slate-700 text-white",
    },
  ] as const;

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
        {dashboardMetricCards.map((item) => (
          <Col key={item.key} xs={24} sm={12} xl={6}>
            <Card
              loading={loading}
              className={`h-full overflow-hidden border bg-gradient-to-br ${item.bgClass} ${item.borderClass} shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg`}
            >
              {loading ? null : (
                <Flex align="start" justify="space-between" gap={12}>
                  <div className="min-w-0">
                    <Typography.Text className="text-sm font-medium text-slate-600">
                      {item.title}
                    </Typography.Text>
                    <Typography.Title
                      level={2}
                      style={{ margin: "8px 0 0", lineHeight: 1.2 }}
                      className="truncate !text-slate-900"
                    >
                      {item.value}
                    </Typography.Title>
                  </div>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg shadow-sm ${item.iconClass}`}>
                    {item.icon}
                  </div>
                </Flex>
              )}
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card
            title="Biểu đồ thu nhập nền tảng"
            loading={loading}
            extra={
              <Flex gap={8} wrap="wrap" justify="end">
                <Segmented
                  value={trendGranularity}
                  options={[
                    { label: "Theo ngày", value: "day" },
                    { label: "Theo tháng", value: "month" },
                  ]}
                  onChange={(value) => setTrendGranularity(value as TrendGranularity)}
                />
                <Segmented
                  value={incomeMetric}
                  options={[
                    { label: "Tổng", value: "total" },
                    { label: "Mua gói", value: "subscription" },
                    { label: "Hoa hồng", value: "commission" },
                  ]}
                  onChange={(value) =>
                    setIncomeMetric(value as "total" | "subscription" | "commission")
                  }
                />
              </Flex>
            }
          >
            <SingleSeriesColumnChart
              rows={incomeChartRows}
              seriesLabel={incomeSeriesLabel}
              barClassName="bg-gradient-to-t from-red-600 to-red-500"
              formatValue={formatCurrency}
            />
          </Card>
        </Col>

        <Col xs={24}>
          <Card
            title="Biểu đồ nạp ví"
            loading={loading}
            extra={
              <Flex gap={8} wrap="wrap" justify="end">
                <Typography.Text type="secondary">
                  {trendGranularity === "day" ? "Theo ngày" : "Theo tháng"}
                </Typography.Text>
                <Segmented
                  value={depositMetric}
                  options={[
                    { label: "Số tiền", value: "amount" },
                    { label: "Số người", value: "users" },
                  ]}
                  onChange={(value) => setDepositMetric(value as "amount" | "users")}
                />
              </Flex>
            }
          >
            <SingleSeriesColumnChart
              rows={depositChartRows}
              seriesLabel={depositSeriesLabel}
              barClassName="bg-gradient-to-t from-red-600 to-red-500"
              formatValue={(value) =>
                depositMetric === "users"
                  ? Number(value || 0).toLocaleString("vi-VN")
                  : formatCurrency(value)
              }
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card title="Biểu đồ yêu cầu nạp tiền" loading={loading}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Flex vertical align="center" gap={8}>
                  <Typography.Text>Nạp tiền thành công</Typography.Text>
                  <Progress type="dashboard" percent={successRate} strokeColor="#16a34a" />
                  <Typography.Text strong>
                    {metrics.completedDeposits} yêu cầu
                  </Typography.Text>
                </Flex>
              </Col>
              <Col xs={24} sm={12}>
                <Flex vertical align="center" gap={8}>
                  <Typography.Text>Nạp tiền thất bại</Typography.Text>
                  <Progress type="dashboard" percent={failedRate} strokeColor="#dc2626" />
                  <Typography.Text strong>{metrics.failedDeposits} yêu cầu</Typography.Text>
                </Flex>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} xl={10}>
          <Card title="Tỉ lệ xử lý yêu cầu nạp tiền" loading={loading}>
            <Flex vertical gap={10}>
              <Typography.Text>Thành công: {successRate}%</Typography.Text>
              <Progress percent={successRate} strokeColor="#16a34a" />

              <Typography.Text>Thất bại: {failedRate}%</Typography.Text>
              <Progress percent={failedRate} strokeColor="#dc2626" />

              <Typography.Text>Đang xử lý: {metrics.pendingDeposits} yêu cầu</Typography.Text>
              <Typography.Text>Đã hủy: {metrics.cancelledDeposits} yêu cầu</Typography.Text>


            </Flex>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <Card
            title="Task quan trọng cần xử lý ngay"
            loading={loading}
            extra={
              <Flex align="center" gap={8}>
                <Typography.Text type="secondary">{visibleUrgentTasks.length} task</Typography.Text>
                {hiddenTaskKeys.length > 0 && (
                  <Button size="small" onClick={restoreHiddenTasks}>
                    Hiện lại task đã ẩn
                  </Button>
                )}
              </Flex>
            }
          >
            {visibleUrgentTasks.length === 0 ? (
              <Empty description="Hiện chưa có task khẩn cấp." />
            ) : (
              <Flex vertical gap={12}>
                {visibleUrgentTasks.map((task) => (
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
                    <Flex gap={8}>
                      <Button type="primary">
                        <Link to={task.actionPath}>{task.actionLabel}</Link>
                      </Button>
                      <Button onClick={() => hideTask(task.key)}>Ẩn task</Button>
                    </Flex>
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

