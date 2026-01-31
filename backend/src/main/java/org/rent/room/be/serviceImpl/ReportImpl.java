package org.rent.room.be.serviceImpl;

import org.rent.room.be.constant.ReportStatus;
import org.rent.room.be.dto.request.report.ReportRequest;
import org.rent.room.be.dto.response.report.ReportResponse;
import org.rent.room.be.entity.Report;
import org.rent.room.be.mapper.ReportMapper;
import org.rent.room.be.repository.ReportRepository;
import org.rent.room.be.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class ReportImpl implements ReportService {
    @Autowired
    private ReportRepository reportRepository;
    @Autowired
    private ReportMapper reportMapper ;


    @Override
    public List<ReportResponse> getAllReports(int page, int size) {
        Pageable pageable = PageRequest.of(page,size);
        Page<Report> reports = reportRepository.findAll(pageable);
        List<ReportResponse> reportResponses = reportMapper.toMapperReportListResponse(reports.getContent());
        return reportResponses;
    }

    @Override
    public void updateReport(UUID reportId, ReportRequest reportRequest) {
        Report report = reportRepository.findById(reportId).orElse(null);
        if(report==null){
            throw new RuntimeException("Report not found cannot update status");
        }

        report.setStatus(reportRequest.getReportStatus());
        reportRepository.save(report);
    }

    @Override
    public void createReport(ReportRequest reportRequest) {

        Report report = Report.builder()
                .title(reportRequest.getTitle())
                .content(reportRequest.getContent())
                .reportId(reportRequest.getReportId())
                .status(ReportStatus.PENDING)
                .reportId(reportRequest.getReportId())
                .build();

        ReportResponse reportResponse = reportMapper.toReportResponse(report);
        reportRepository.save(report);
    }

    @Override
    public void deleteReport(UUID reportId) {
        Report report = reportRepository.findById(reportId).orElse(null);
        if(report!=null){
           report.setIsDeleted(true);
        }
    }

    @Override
    public Report findReportById(UUID reportId) {
        return reportRepository.findById(reportId).orElse(null);
    }


}
