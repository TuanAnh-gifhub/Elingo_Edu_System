package org.rent.room.be.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.base.ApiResponse;
import org.rent.room.be.dto.request.submission.CreateSubmissionRequest;
import org.rent.room.be.dto.request.submission.GradeSubmissionRequest;
import org.rent.room.be.dto.response.submission.SubmissionResponse;
import org.rent.room.be.service.SubmissionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/submissions")
@Tag(name = "10. Submission")
public class SubmissionController {

    SubmissionService submissionService;

    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<SubmissionResponse>> createSubmission(
            @Valid @RequestBody CreateSubmissionRequest request
    ) {
        SubmissionResponse response = submissionService.createSubmission(request);
        return ResponseEntity.ok(ApiResponse.<SubmissionResponse>builder()
                .code(201)
                .message("Create submission successfully")
                .result(response)
                .build());
    }

    @GetMapping("/{submissionId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<SubmissionResponse>> getSubmissionById(@PathVariable UUID submissionId) {
        SubmissionResponse response = submissionService.getSubmissionById(submissionId);
        return ResponseEntity.ok(ApiResponse.<SubmissionResponse>builder()
                .code(200)
                .message("Get submission successfully")
                .result(response)
                .build());
    }

    @GetMapping("/latest/by-assignment/{assignmentId}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<SubmissionResponse>> getLatestMySubmissionByAssignment(
            @PathVariable UUID assignmentId
    ) {
        SubmissionResponse response = submissionService.getLatestMySubmissionByAssignment(assignmentId);
        return ResponseEntity.ok(ApiResponse.<SubmissionResponse>builder()
                .code(200)
                .message("Get latest submission successfully")
                .result(response)
                .build());
    }

    @GetMapping("/latest/by-assignments")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<Map<UUID, SubmissionResponse>>> getLatestMySubmissionsByAssignments(
            @RequestParam List<UUID> assignmentIds
    ) {
        Map<UUID, SubmissionResponse> response = submissionService.getLatestMySubmissionsByAssignmentIds(assignmentIds);
        return ResponseEntity.ok(ApiResponse.<Map<UUID, SubmissionResponse>>builder()
                .code(200)
                .message("Get latest submissions successfully")
                .result(response)
                .build());
    }

    @PatchMapping("/{submissionId}/grade")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ApiResponse<SubmissionResponse>> gradeSubmission(
            @PathVariable UUID submissionId,
            @Valid @RequestBody GradeSubmissionRequest request
    ) {
        SubmissionResponse response = submissionService.gradeSubmission(submissionId, request);
        return ResponseEntity.ok(ApiResponse.<SubmissionResponse>builder()
                .code(200)
                .message("Grade submission successfully")
                .result(response)
                .build());
    }
}

