package org.rent.room.be.service;

import org.rent.room.be.dto.request.report.ReportRequest;
import org.rent.room.be.dto.response.report.ReportResponse;
import org.rent.room.be.entity.Report;


import java.util.List;
import java.util.UUID;

public interface ReportService {

     List<ReportResponse> getAllReports(int page, int size);
     void updateReport(UUID reportId, ReportRequest reportRequest);
     void createReport(ReportRequest reportRequest);
     Report findReportById(UUID reportId);
     void  deleteReport(UUID reportId);

}
