package org.rent.room.be.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.base.ApiResponse;
import org.rent.room.be.dto.request.enrollment.CreateEnrollmentRequest;
import org.rent.room.be.dto.request.enrollment.UpdateQuizScoreColumnsRequest;
import org.rent.room.be.dto.response.enrollment.ClassQuizScoreMatrixResponse;
import org.rent.room.be.dto.response.enrollment.EnrollmentResponse;
import org.rent.room.be.service.EnrollmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RequiredArgsConstructor
@RestController
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/enrollments")
@Tag(name = "6. Enrollment")
public class EnrollmentController {

    EnrollmentService enrollmentService;

    @PreAuthorize("hasAnyRole('STUDENT','TEACHER')")
    @PostMapping
    public ResponseEntity<ApiResponse<EnrollmentResponse>> createEnrollment(
            @RequestBody CreateEnrollmentRequest request
    ) {
        EnrollmentResponse response = enrollmentService.createEnrollment(request);
        return ResponseEntity.ok(
                ApiResponse.<EnrollmentResponse>builder()
                        .code(201)
                        .message("Enroll class successfully")
                        .result(response)
                        .build()
        );
    }

    @PreAuthorize("hasAnyRole('STUDENT','TEACHER')")
    @GetMapping("/check")
    public ResponseEntity<ApiResponse<Boolean>> checkEnrollment(
            @RequestParam UUID classId
    ) {
        boolean enrolled = enrollmentService.checkEnrollment(classId);
        return ResponseEntity.ok(
                ApiResponse.<Boolean>builder()
                        .code(200)
                        .message("Check enrollment successfully")
                        .result(enrolled)
                        .build()
        );
    }

    @PreAuthorize("hasAnyRole('STUDENT','TEACHER')")
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<EnrollmentResponse>>> getMyEnrollments() {
        List<EnrollmentResponse> enrollments = enrollmentService.getMyEnrollments();
        return ResponseEntity.ok(
                ApiResponse.<List<EnrollmentResponse>>builder()
                        .code(200)
                        .message("Get my enrollments successfully")
                        .result(enrollments)
                        .build()
        );
    }

    @PreAuthorize("hasAnyRole('TEACHER','STUDENT')")
    @GetMapping("/classes/{classId}")
    public ResponseEntity<ApiResponse<List<EnrollmentResponse>>> getEnrollmentsByClass(
            @PathVariable UUID classId
    ) {
        List<EnrollmentResponse> enrollments = enrollmentService.getEnrollmentsByClass(classId);
        return ResponseEntity.ok(
                ApiResponse.<List<EnrollmentResponse>>builder()
                        .code(200)
                        .message("Get class enrollments successfully")
                        .result(enrollments)
                        .build()
        );
    }

    @PreAuthorize("hasAnyRole('TEACHER','STUDENT')")
    @GetMapping("/classes/{classId}/quiz-score-matrix")
    public ResponseEntity<ApiResponse<ClassQuizScoreMatrixResponse>> getClassQuizScoreMatrix(
            @PathVariable UUID classId
    ) {
        ClassQuizScoreMatrixResponse response = enrollmentService.getClassQuizScoreMatrix(classId);
        return ResponseEntity.ok(
                ApiResponse.<ClassQuizScoreMatrixResponse>builder()
                        .code(200)
                        .message("Get class quiz score matrix successfully")
                        .result(response)
                        .build()
        );
    }

    @PreAuthorize("hasRole('TEACHER')")
    @PutMapping("/classes/{classId}/quiz-score-columns")
    public ResponseEntity<ApiResponse<ClassQuizScoreMatrixResponse>> updateClassQuizScoreColumns(
            @PathVariable UUID classId,
            @RequestBody UpdateQuizScoreColumnsRequest request
    ) {
        ClassQuizScoreMatrixResponse response = enrollmentService.updateClassQuizScoreColumns(classId, request);
        return ResponseEntity.ok(
                ApiResponse.<ClassQuizScoreMatrixResponse>builder()
                        .code(200)
                        .message("Update class quiz score columns successfully")
                        .result(response)
                        .build()
        );
    }
}
