package org.rent.room.be.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.base.ApiResponse;
import org.rent.room.be.constant.TeacherVerificationStatus;
import org.rent.room.be.dto.request.teacherVerification.TeacherVerificationRejectRequest;
import org.rent.room.be.dto.request.teacherVerification.TeacherVerificationReviewRequest;
import org.rent.room.be.dto.request.teacherVerification.TeacherVerificationSubmitRequest;
import org.rent.room.be.dto.response.teacherVerification.TeacherVerificationResponse;
import org.rent.room.be.service.TeacherVerificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Tag(name = "10. Teacher Verification")
public class TeacherVerificationController {

    TeacherVerificationService teacherVerificationService;

    @PostMapping("/teacher-verification/request")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<TeacherVerificationResponse>> submitRequest(
            @RequestBody @Valid TeacherVerificationSubmitRequest request
    ) {
        return ResponseEntity.ok(
                ApiResponse.<TeacherVerificationResponse>builder()
                        .code(200)
                        .message("Teacher verification request submitted")
                        .result(teacherVerificationService.submitRequest(request))
                        .build()
        );
    }

    @GetMapping("/teacher-verification/my-request")
    @PreAuthorize("hasAnyRole('STUDENT','TEACHER')")
    public ResponseEntity<ApiResponse<TeacherVerificationResponse>> getMyRequest() {
        return ResponseEntity.ok(
                ApiResponse.<TeacherVerificationResponse>builder()
                        .code(200)
                        .message("Get my teacher verification request successfully")
                        .result(teacherVerificationService.getMyRequest())
                        .build()
        );
    }

    @PostMapping("/teacher-verification/upload-certificate")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<String>> uploadCertificate(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(
                ApiResponse.<String>builder()
                        .code(200)
                        .message("Upload certificate successfully")
                        .result(teacherVerificationService.uploadCertificate(file))
                        .build()
        );
    }

    @PostMapping("/teacher-verification/upload-certificates")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<List<String>>> uploadCertificates(
            @RequestParam("files") List<MultipartFile> files
    ) {
        return ResponseEntity.ok(
                ApiResponse.<List<String>>builder()
                        .code(200)
                        .message("Upload certificates successfully")
                        .result(teacherVerificationService.uploadCertificates(files))
                        .build()
        );
    }

    @GetMapping("/admin/teacher-verification")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<TeacherVerificationResponse>>> getAllRequests() {
        return ResponseEntity.ok(
                ApiResponse.<List<TeacherVerificationResponse>>builder()
                        .code(200)
                        .message("Get teacher verification requests successfully")
                        .result(teacherVerificationService.getAllRequests())
                        .build()
        );
    }

    @GetMapping("/admin/teacher-verification/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TeacherVerificationResponse>> getRequestById(@PathVariable UUID id) {
        return ResponseEntity.ok(
                ApiResponse.<TeacherVerificationResponse>builder()
                        .code(200)
                        .message("Get teacher verification request successfully")
                        .result(teacherVerificationService.getRequestById(id))
                        .build()
        );
    }

    @PutMapping("/admin/teacher-verification/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TeacherVerificationResponse>> approve(@PathVariable UUID id) {
        return ResponseEntity.ok(
                ApiResponse.<TeacherVerificationResponse>builder()
                        .code(200)
                        .message("Approve teacher verification request successfully")
                        .result(teacherVerificationService.review(id, TeacherVerificationStatus.APPROVED, null))
                        .build()
        );
    }

    @PutMapping("/admin/teacher-verification/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TeacherVerificationResponse>> reject(
            @PathVariable UUID id,
            @RequestBody(required = false) @Valid TeacherVerificationRejectRequest request
    ) {
        String adminNote = request == null ? null : request.getAdminNote();

        return ResponseEntity.ok(
                ApiResponse.<TeacherVerificationResponse>builder()
                        .code(200)
                        .message("Reject teacher verification request successfully")
                        .result(teacherVerificationService.review(id, TeacherVerificationStatus.REJECTED, adminNote))
                        .build()
        );
    }

    @PutMapping("/admin/teacher-verification/{id}/review")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TeacherVerificationResponse>> review(
            @PathVariable UUID id,
            @RequestBody @Valid TeacherVerificationReviewRequest request
    ) {
        return ResponseEntity.ok(
                ApiResponse.<TeacherVerificationResponse>builder()
                        .code(200)
                        .message("Update teacher verification request successfully")
                        .result(teacherVerificationService.review(id, request.getStatus(), request.getAdminNote()))
                        .build()
        );
    }
}

