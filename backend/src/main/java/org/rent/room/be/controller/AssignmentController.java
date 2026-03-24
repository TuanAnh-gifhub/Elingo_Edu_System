package org.rent.room.be.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.base.ApiResponse;
import org.rent.room.be.base.PageResponse;
import org.rent.room.be.dto.request.assignment.CreateAssignmentRequest;
import org.rent.room.be.dto.request.assignment.UpdateAssignmentRequest;
import org.rent.room.be.dto.response.assignment.AssignmentResponse;
import org.rent.room.be.dto.response.audio.AssignmentAudioResponse;
import org.rent.room.be.dto.response.submission.SubmissionResponse;
import org.rent.room.be.service.AssignmentAudioService;
import org.rent.room.be.service.AssignmentService;
import org.rent.room.be.service.SubmissionService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/assignments")
@Tag(name = "9. Assignment")
public class AssignmentController {

    AssignmentService assignmentService;
    SubmissionService submissionService;
    AssignmentAudioService assignmentAudioService;

    @PostMapping
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ApiResponse<AssignmentResponse>> createAssignment(
            @Valid @RequestBody CreateAssignmentRequest request
    ) {
        AssignmentResponse response = assignmentService.createAssignment(request);
        return ResponseEntity.ok(ApiResponse.<AssignmentResponse>builder()
                .code(201)
                .message("Create assignment successfully")
                .result(response)
                .build());
    }

    @PutMapping("/{assignmentId}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ApiResponse<AssignmentResponse>> updateAssignment(
            @PathVariable UUID assignmentId,
            @Valid @RequestBody UpdateAssignmentRequest request
    ) {
        AssignmentResponse response = assignmentService.updateAssignment(assignmentId, request);
        return ResponseEntity.ok(ApiResponse.<AssignmentResponse>builder()
                .code(200)
                .message("Update assignment successfully")
                .result(response)
                .build());
    }

    @DeleteMapping("/{assignmentId}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ApiResponse<Void>> deleteAssignment(@PathVariable UUID assignmentId) {
        assignmentService.deleteAssignment(assignmentId);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .code(200)
                .message("Delete assignment successfully")
                .build());
    }

    @GetMapping("/{assignmentId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<AssignmentResponse>> getAssignmentById(@PathVariable UUID assignmentId) {
        AssignmentResponse response = assignmentService.getAssignmentById(assignmentId);
        return ResponseEntity.ok(ApiResponse.<AssignmentResponse>builder()
                .code(200)
                .message("Get assignment successfully")
                .result(response)
                .build());
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PageResponse<AssignmentResponse>>> getAssignments(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) UUID classId,
            @RequestParam(required = false) UUID teacherId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) LocalDateTime deadlineFrom,
            @RequestParam(required = false) LocalDateTime deadlineTo,
            @RequestParam(required = false) Boolean active
    ) {
        PageResponse<AssignmentResponse> result = assignmentService.getAssignments(
                page - 1,
                size,
                classId,
                teacherId,
                keyword,
                deadlineFrom,
                deadlineTo,
                active
        );
        return ResponseEntity.ok(ApiResponse.<PageResponse<AssignmentResponse>>builder()
                .code(200)
                .message("Get assignments successfully")
                .result(result)
                .build());
    }

    @GetMapping("/{assignmentId}/submissions")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ApiResponse<PageResponse<SubmissionResponse>>> getSubmissionsByAssignment(
            @PathVariable UUID assignmentId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        PageResponse<SubmissionResponse> result = submissionService.getSubmissionsByAssignment(assignmentId, page - 1, size);
        return ResponseEntity.ok(ApiResponse.<PageResponse<SubmissionResponse>>builder()
                .code(200)
                .message("Get submissions successfully")
                .result(result)
                .build());
    }

    @PostMapping(value = "/audio", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<AssignmentAudioResponse>> uploadAudio(
            @RequestPart("file") MultipartFile file
    ) throws IOException {
        AssignmentAudioResponse response = assignmentAudioService.uploadAudio(file);
        return ResponseEntity.ok(ApiResponse.<AssignmentAudioResponse>builder()
                .code(200)
                .message("Upload audio successfully")
                .result(response)
                .build());
    }
}

