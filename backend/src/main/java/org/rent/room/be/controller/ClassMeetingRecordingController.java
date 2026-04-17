package org.rent.room.be.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.rent.room.be.base.ApiResponse;
import org.rent.room.be.dto.response.classroom.ClassMeetingRecordingResponse;
import org.rent.room.be.exception.AppException;
import org.rent.room.be.exception.ErrorCode;
import org.rent.room.be.security.SecurityUtils;
import org.rent.room.be.service.ClassMeetingRecordingService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@Tag(name = "3.1 Class Meeting Recording")
public class ClassMeetingRecordingController {

    private final ClassMeetingRecordingService classMeetingRecordingService;

    @Value("${jitsi.jaas.webhook-secret:}")
    private String jaasWebhookSecret;

    @GetMapping("/classes/{classId}/recordings/student")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<ClassMeetingRecordingResponse>>> getStudentRecordings(
            @PathVariable UUID classId
    ) {
        UUID currentUserId = SecurityUtils.requireCurrentUser().getUserId();
        List<ClassMeetingRecordingResponse> result = classMeetingRecordingService
                .getRecordingsForStudent(classId, currentUserId);
        return ResponseEntity.ok(ApiResponse.<List<ClassMeetingRecordingResponse>>builder()
                .code(200)
                .message("Get class recordings successfully")
                .result(result)
                .build());
    }

    @GetMapping("/classes/{classId}/recordings/teacher")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ApiResponse<List<ClassMeetingRecordingResponse>>> getTeacherRecordings(
            @PathVariable UUID classId
    ) {
        UUID currentUserId = SecurityUtils.requireCurrentUser().getUserId();
        List<ClassMeetingRecordingResponse> result = classMeetingRecordingService
                .getRecordingsForTeacher(classId, currentUserId);
        return ResponseEntity.ok(ApiResponse.<List<ClassMeetingRecordingResponse>>builder()
                .code(200)
                .message("Get class recordings successfully")
                .result(result)
                .build());
    }

    @PostMapping("/recordings/webhooks/jaas")
    public ResponseEntity<ApiResponse<Void>> handleJaasWebhook(
            @RequestHeader(name = "X-Jaas-Webhook-Secret", required = false) String webhookSecret,
            @RequestBody Map<String, Object> payload
    ) {
        if (StringUtils.hasText(jaasWebhookSecret) && !jaasWebhookSecret.equals(webhookSecret)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        classMeetingRecordingService.handleJaasWebhook(payload);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .code(200)
                .message("JaaS recording webhook received")
                .build());
    }
}

