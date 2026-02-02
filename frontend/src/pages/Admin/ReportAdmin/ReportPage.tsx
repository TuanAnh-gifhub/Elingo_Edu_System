import ReportList from "./ReportList";
import ReportStatic from "./ReportStatic";
import ReportDetailModal from "./ReportDetailModal";
import { reportService } from "../../../services/reportService/reportService";
import { message } from "antd";
import { useEffect, useState } from "react";
import ReportUpdateModal from "./ReportUpdateModal";
import ReportFilter from "./ReportFilter";

export default function ReportPage() {
  const [messageApi, contextHolder] = message.useMessage();

  const [reportData, setReportData] = useState<any[]>([]);
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [total, setTotal] = useState(0);

  const [selectedReport, setSelectedReport] = useState<any>(null);

  const [openDetail, setOpenDetail] = useState(false);
  const [openUpdate, setOpenUpdate] = useState(false);

  const handleViewDetail = async (reportId: string) => {
    try {
      const res = await reportService.getRepportById(reportId);
      setSelectedReport(res.data.result);
      console.log("chi tiết", res.data.result);
      setOpenDetail(true);
    } catch {
      messageApi.error("Không tải được chi tiết report");
    }
  };

  const handleOpenUpdate = async (reportId: string) => {
    try {
      const res = await reportService.getRepportById(reportId);
      setSelectedReport(res.data.result);
      setOpenUpdate(true);
    } catch {
      messageApi.error("Không tải được report");
    }
  };

  //  reportService.getAllReports
  useEffect(() => {
    const fetchData = async () => {
      const res = await reportService.getAllReports({
        ...filters,
        page,
        size: pageSize,
      });

      setReportData(res.data.result.data);
      setTotal(res.data.result.totalElements);
    };

    fetchData();
  }, [filters, page, pageSize]);

  return (
    <div>
      {contextHolder}

      <ReportStatic />
      <ReportFilter
        onChange={(filters) => {
          setFilters(filters);
          setPage(1); // reset page khi filter
        }}
      />

      <ReportList
        data={reportData}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={(p, ps) => {
          setPage(p);
          setPageSize(ps);
        }}
        onViewDetail={handleViewDetail}
        onUpdate={handleOpenUpdate}
      />

      <ReportDetailModal
        open={openDetail}
        onClose={() => setOpenDetail(false)}
        data={selectedReport}
      />
      <ReportUpdateModal
        open={openUpdate}
        onClose={() => {
          setOpenUpdate(false);
          setSelectedReport(null);
        }}
        data={selectedReport}
        onSuccess={() => {
          setPage(1);
        }}
      />
    </div>
  );
}
