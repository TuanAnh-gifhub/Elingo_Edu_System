package org.rent.room.be.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.rent.room.be.base.ApiResponse;
import org.rent.room.be.base.PageResponse;
import org.rent.room.be.constant.ReportStatus;
import org.rent.room.be.dto.request.report.ReportRequest;
import org.rent.room.be.dto.request.report.ReportStatusRequest;
import org.rent.room.be.dto.response.report.ReportResponse;
import org.rent.room.be.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/reports")
@Tag(name = "5. Report")
public class ReportController {

    @Autowired
    private ReportService reportService;

    @GetMapping()
    public ApiResponse<?>getAllReports(
            @RequestParam(required = false)ReportStatus reportStatus,
            @RequestParam(required = false)String keyword,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDate fromDate,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDate toDate,
            @RequestParam(defaultValue = "1", required = false) int page,
            @RequestParam(defaultValue = "10", required = false) int size) {
        try {

            return ApiResponse.builder()
                    .code(200)
                    .message("Get all reports successfully")
                    .result( reportService.getAllReports(page, size,reportStatus,keyword,fromDate,toDate))
                    .build();

        } catch (Exception e) {
            return ApiResponse.builder()
                    .code(500)
                    .message("Api system have some problem " + e.getMessage())
                    .build();
        }

    }

    @PostMapping
    public ApiResponse<?> createReport(@Valid @RequestBody ReportRequest reportRequest) {
        try {
            reportService.createReport(reportRequest);
            return ApiResponse.builder()
                    .code(200)
                    .message("Create report successfully")
                    .result(null)
                    .build();

        } catch (Exception e) {
            return ApiResponse.builder()
                    .code(500)
                    .message("Api system have some problem " + e.getMessage())
                    .build();
        }

    }


    @PutMapping("/{reportId}")
    public ApiResponse<?> updateReport(@PathVariable UUID reportId,@Valid @RequestBody ReportStatusRequest reportRequest) {
        try {
            reportService.updateReport(reportId, reportRequest);
            System.out.println(reportId);
            return
                    ApiResponse.builder()
                    .code(200)
                    .message("Update report successfully")
                    .result(null)
                    .build();
        }catch (Exception e){
            e.printStackTrace();
            return ApiResponse.builder()
                    .code(500)
                    .message("Api system have some problem " + e.getMessage())
                    .build();
        }

    }

    @GetMapping("/{reportId}")
    public ApiResponse<?> getReportById(@PathVariable UUID reportId) {

        try{

            ReportResponse rp = reportService.findReportById(reportId);
            return ApiResponse.builder()
                            .code(200)
                            .message("Get report by id successfully")
                            .result(rp)
                            .build();
        }catch(Exception e){

            return ApiResponse.builder()
                    .code(500)
                    .message("Api system have some problem " + e.getMessage())
                    .build();
        }
    }

    @DeleteMapping("/{reportId}")
    public ApiResponse<?> deleteReport(@PathVariable UUID reportId) {
      try{
          reportService.deleteReport(reportId);

          return ApiResponse.builder()
                  .code(200)
                  .message("Delete report successfully")
                  .result(null)
                  .build();

      }catch (Exception e){
            return ApiResponse.builder()
                    .code(500)
                    .message("Api system have some problem " + e.getMessage())
                    .build();
      }
    }

    @GetMapping("/statistics")
    public ApiResponse<?> getReportStatistics() {

        try{
            return  ApiResponse.builder()
                    .code(200)
                    .message("Get reports statistics successfully")
                    .result(reportService.getStatistic())
                    .build();

        }catch(Exception e){
            return  ApiResponse.builder()
                    .code(500)
                    .message("Api system have some problem " + e.getMessage())
                    .build();
        }
    }

}
