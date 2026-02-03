package org.rent.room.be.service;

import org.rent.room.be.base.PageResponse;
import org.rent.room.be.constant.ReportStatus;
import org.rent.room.be.dto.request.report.ReportRequest;
import org.rent.room.be.dto.request.report.ReportStatusRequest;
import org.rent.room.be.dto.response.report.ReportResponse;
import org.rent.room.be.dto.response.report.ReportStatic;
import org.rent.room.be.entity.Report;


import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface ReportService {

    PageResponse<ReportResponse> getAllReports(
            int page,
            int size,
            ReportStatus status,
            String keyword,
            LocalDate from,
            LocalDate to
    );
     void updateReport(UUID reportId, ReportStatusRequest reportRequest);
     void createReport(ReportRequest reportRequest);
    ReportResponse findReportById(UUID reportId);
     void  deleteReport(UUID reportId);
     ReportStatic getStatistic();

}
