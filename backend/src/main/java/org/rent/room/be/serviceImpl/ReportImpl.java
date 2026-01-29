package org.rent.room.be.serviceImpl;

import lombok.extern.slf4j.Slf4j;
import org.rent.room.be.base.PageResponse;
import org.rent.room.be.constant.ReportStatus;
import org.rent.room.be.dto.request.report.ReportRequest;
import org.rent.room.be.dto.request.report.ReportStatusRequest;
import org.rent.room.be.dto.response.UserResponse;
import org.rent.room.be.dto.response.report.ReportResponse;
import org.rent.room.be.dto.response.report.ReportStatic;
import org.rent.room.be.entity.Report;
import org.rent.room.be.entity.User;
import org.rent.room.be.mapper.ReportMapper;
import org.rent.room.be.repository.ReportRepository;
import org.rent.room.be.service.EmailService;
import org.rent.room.be.service.ReportService;
import org.rent.room.be.service.UserService;

import org.rent.room.be.specification.ReportSpecification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
@Slf4j
@Service
public class ReportImpl implements ReportService {
    @Autowired
    private ReportRepository reportRepository;
    @Autowired
    private ReportMapper reportMapper;
    @Autowired
    private EmailService emailService;
    @Autowired
    UserService userService;

    @Override
    public PageResponse<ReportResponse> getAllReports(
            int page,
            int size,
            ReportStatus status,
            String keyword,
            LocalDate from,
            LocalDate to
    ) {
        Pageable pageable = PageRequest.of(
                page - 1,
                size,
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        Specification<Report> spec =
                ReportSpecification.filter(status, keyword, from, to);

        Page<Report> reports = reportRepository.findAll(spec, pageable);

        List<ReportResponse> data = reports.getContent().stream()
                .map(report -> {
                    User user = report.getUser();
                    UserResponse userResponse = user == null ? null :
                            UserResponse.builder()
                                    .email(user.getEmail())
                                    .phone(user.getPhone())
                                    .build();

                    return ReportResponse.builder()
                            .reportId(report.getReportId())
                            .title(report.getTitle())
                            .content(report.getContent())
                            .address(report.getAddress())
                            .status(report.getStatus())
                            .createdAt(report.getCreatedAt())
                            .updatedAt(report.getUpdatedAt())
                            .user(userResponse)
                            .build();
                })
                .toList();

        return PageResponse.<ReportResponse>builder()
                .currentPage(reports.getNumber() + 1)
                .totalPages(reports.getTotalPages())
                .pageSize(reports.getSize())
                .totalElements(reports.getTotalElements())
                .data(data)
                .build();
    }


    @Override
    public void updateReport(UUID reportId, ReportStatusRequest request) {
        Report report = reportRepository.findById(reportId).orElse(null);

        if (report == null) {
            throw new RuntimeException("Report not found cannot update status");
        }
        report.setUpdatedAt(LocalDateTime.now());

        if(request.getReportStatus().equals(ReportStatus.RESOLVED)){
            report.setStatus(ReportStatus.RESOLVED);
            System.err.println("Gui mail thanh cong");
            emailService.sendEmailToReporter(request.getUserName(),request.getEmail(),request.getContent());

        }else if(request.getReportStatus().equals(ReportStatus.REJECTED)){
            report.setStatus(ReportStatus.REJECTED);
        }

        reportRepository.save(report);

    }


    @Override
    public void createReport(ReportRequest reportRequest) {
        User user = userService.findByUserId(reportRequest.getReportId());

        if (user == null) {
            throw new RuntimeException("User not found cannot create report");
        }

        Report report = Report.builder()
                .title(reportRequest.getTitle())
                .content(reportRequest.getContent())
                .user(user)
                .address(reportRequest.getAddress())
                .status(ReportStatus.PENDING)
                .isDeleted(false)
                .build();

        ReportResponse reportResponse = reportMapper.toReportResponse(report);
        reportRepository.save(report);
    }

    @Override
    public void deleteReport(UUID reportId) {
        Report report = reportRepository.findById(reportId).orElse(null);
        if (report != null) {
            report.setIsDeleted(true);
        }
    }

    @Override
    public ReportStatic getStatistic() {
        Object[] countAllStatus = reportRepository.countAllStatus();
        Object[] row = (Object[]) countAllStatus[0];

        int pending  = ((Number) row[0]).intValue();
        int resolved = ((Number) row[1]).intValue();
        int rejected = ((Number) row[2]).intValue();

        return ReportStatic.builder()
                .countTotal(pending + resolved + rejected)
                .countResolved(resolved)
                .countPending(pending)
                .countRejected(rejected)
                .build();
    }

    @Override
    public ReportResponse findReportById(UUID reportId) {
        Report rp = reportRepository.findById(reportId).orElse(null);
        if (rp != null) {
            return reportMapper.toReportResponse(rp);
        }
        return null;
    }


}
