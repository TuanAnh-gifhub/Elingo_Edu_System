package org.rent.room.be.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import org.rent.room.be.base.ApiResponse;
import org.rent.room.be.dto.request.report.ReportRequest;
import org.rent.room.be.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/reports")
@Tag(name = "3. Report", description = "API quản lý báo cáo vi phạm")
public class ReportController {

    @Autowired
    private ReportService reportService;

    @GetMapping("/all")
    public ApiResponse<?> getAllReports(
            @RequestParam(defaultValue = "1", required = false) int page,
            @RequestParam(defaultValue = "10", required = false) int size) {
        try {
            return ApiResponse.builder()
                    .code(200)
                    .message("Get all reports successfully")
                    .result(reportService.getAllReports(page, size))
                    .build();

        } catch (Exception e) {
            return ApiResponse.builder()
                    .code(500)
                    .message("Api system have some problem " + e.getMessage())
                    .build();
        }

    }

    @PostMapping("/create")
    public ApiResponse<?> createReport(@RequestBody ReportRequest reportRequest) {
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


    @PutMapping("/update-report/{reportId}")
    public ApiResponse<?> updateReport(@PathVariable UUID reportId,ReportRequest reportRequest) {
        try {
            reportService.updateReport(reportId, reportRequest);
            return
                    ApiResponse.builder()
                    .code(200)
                    .message("Update report successfully")
                    .result(null)
                    .build();
        }catch (Exception e){
            return ApiResponse.builder()
                    .code(500)
                    .message("Api system have some problem " + e.getMessage())
                    .build();
        }

    }

    @GetMapping("/get-report-by-id/{reportId}")
    public ApiResponse<?> getReportById(@PathVariable UUID reportId) {

        try{
            return ApiResponse.builder()
                            .code(200)
                            .message("Get report successfully")
                            .result(reportService.findReportById(reportId))
                            .build();
        }catch(Exception e){

            return ApiResponse.builder()
                    .code(500)
                    .message("Api system have some problem " + e.getMessage())
                    .build();
        }
    }

    @DeleteMapping("/delete-report/{reportId}")
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

}
