import { Col, Row, Statistic } from "antd";
import {
  ReloadOutlined,
  CheckCircleOutlined,
  LineChartOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { useCountUp } from "../../../hooks/useCountUp";
import { reportService } from "../../../services/reportService/reportService";
import { useEffect, useState } from "react";
interface ReportStatistic {
  countTotal: number;
  countPending: number;
  countResolved: number;
  countRejected: number;
}

export default function ReportStatic() {
  const [dataReport, setDataReport] = useState<ReportStatistic | null>(null);

  const fetchData = async () => {
    try {
      const response = await reportService.getReportStatistics();
      setDataReport(response.data.result);
      console.log(response.data.result);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  const countForTotal = useCountUp({
    end: dataReport?.countTotal ?? 0,
    duration: 50,
  });

  const countForComplete = useCountUp({
    end: dataReport?.countResolved ?? 0,
    duration: 50,
  });

  const countPending = useCountUp({
    end: dataReport?.countPending ?? 0,
    duration: 50,
  });

  const countReject = useCountUp({
    end: dataReport?.countRejected ?? 0,
    duration: 50,
  });

  return (
    <Row gutter={16} className="flex justify-between py-1 px-2">
      <Col span={6} className="text-center">
        <Statistic
          title="Tổng báo cáo"
          value={countForTotal}
          valueStyle={{ color: "#1677ff" }}
          prefix={<LineChartOutlined />}
        />
      </Col>

      <Col span={6} className="text-center">
        <Statistic
          title="Đã xử lý"
          value={countForComplete}
          valueStyle={{ color: "#52c41a" }}
          prefix={<CheckCircleOutlined />}
        />
      </Col>

      <Col span={6} className="text-center">
        <Statistic
          title="Đang xử lý"
          value={countPending}
          valueStyle={{ color: "#faad14" }}
          prefix={<ReloadOutlined />}
        />
      </Col>

      <Col span={6} className="text-center">
        <Statistic
          title="Đã từ chối"
          value={countReject}
          valueStyle={{ color: "#ff4d4f" }}
          prefix={<CloseCircleOutlined />}
        />
      </Col>
    </Row>
  );
}
