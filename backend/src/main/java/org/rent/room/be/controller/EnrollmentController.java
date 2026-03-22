package org.rent.room.be.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.base.ApiResponse;
import org.rent.room.be.dto.request.enrollment.CreateEnrollmentRequest;
import org.rent.room.be.dto.response.enrollment.EnrollmentResponse;
import org.rent.room.be.service.EnrollmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RequiredArgsConstructor
@RestController
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/enrollments")
@Tag(name = "6. Enrollment")
public class EnrollmentController {

    EnrollmentService enrollmentService;

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
}
