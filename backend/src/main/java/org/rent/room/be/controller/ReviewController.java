package org.rent.room.be.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.base.ApiResponse;
import org.rent.room.be.base.PageResponse;
import org.rent.room.be.dto.request.review.CreateReviewRequest;
import org.rent.room.be.dto.request.review.UpdateReviewRequest;
import org.rent.room.be.dto.response.review.ReviewResponse;
import org.rent.room.be.dto.response.review.ReviewSummaryResponse;
import org.rent.room.be.security.SecurityUtils;
import org.rent.room.be.service.ReviewService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.UUID;

@RequiredArgsConstructor
@RestController
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/reviews")
@Tag(name = "7. Review")
public class ReviewController {

    ReviewService reviewService;

    @PreAuthorize("hasRole('TEACHER') or hasRole('STUDENT')")
    @PostMapping
    public ResponseEntity<ApiResponse<ReviewResponse>> createReview(
            @RequestParam(required = false) UUID classId,
            @Valid @RequestBody CreateReviewRequest request
    ) {
        UUID userId = SecurityUtils.requireCurrentUser().getUserId();
        ReviewResponse response = reviewService.createReview(userId, classId, request);
        return ResponseEntity.ok(ApiResponse.<ReviewResponse>builder()
                .code(201)
                .message("Create review successfully")
                .result(response)
                .build());
    }

    @GetMapping("/class/{classId}")
    public ResponseEntity<ApiResponse<PageResponse<ReviewResponse>>> getReviewsByClass(
            @PathVariable UUID classId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        PageResponse<ReviewResponse> response = reviewService.getReviewsByClass(classId, page, size);
        return ResponseEntity.ok(ApiResponse.<PageResponse<ReviewResponse>>builder()
                .code(200)
                .message("Get reviews successfully")
                .result(response)
                .build());
    }

    @GetMapping("/global")
    public ResponseEntity<ApiResponse<PageResponse<ReviewResponse>>> getGlobalReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        PageResponse<ReviewResponse> response = reviewService.getGlobalReviews(page, size);
        return ResponseEntity.ok(ApiResponse.<PageResponse<ReviewResponse>>builder()
                .code(200)
                .message("Get global reviews successfully")
                .result(response)
                .build());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/all")
    public ResponseEntity<ApiResponse<PageResponse<ReviewResponse>>> getAdminReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        PageResponse<ReviewResponse> response = reviewService.getAdminReviews(page, size);
        return ResponseEntity.ok(ApiResponse.<PageResponse<ReviewResponse>>builder()
                .code(200)
                .message("Get admin reviews successfully")
                .result(response)
                .build());
    }

    @GetMapping("/class/{classId}/summary")
    public ResponseEntity<ApiResponse<ReviewSummaryResponse>> getSummaryByClass(@PathVariable UUID classId) {
        ReviewSummaryResponse summary = reviewService.getSummaryByClass(classId);
        return ResponseEntity.ok(ApiResponse.<ReviewSummaryResponse>builder()
                .code(200)
                .message("Get review summary successfully")
                .result(summary)
                .build());
    }

    @PreAuthorize("hasRole('TEACHER') or hasRole('STUDENT') or hasRole('ADMIN')")
    @PutMapping("/{reviewId}")
    public ResponseEntity<ApiResponse<ReviewResponse>> updateReview(
            @PathVariable UUID reviewId,
            @Valid @RequestBody UpdateReviewRequest request
    ) {
        UUID userId = SecurityUtils.requireCurrentUser().getUserId();
        ReviewResponse response = reviewService.updateReview(reviewId, userId, request);
        return ResponseEntity.ok(ApiResponse.<ReviewResponse>builder()
                .code(200)
                .message("Update review successfully")
                .result(response)
                .build());
    }

    @PreAuthorize("hasRole('TEACHER') or hasRole('STUDENT') or hasRole('ADMIN')")
    @DeleteMapping("/{reviewId}")
    public ResponseEntity<ApiResponse<Void>> deleteReview(
            @PathVariable UUID reviewId
    ) {
        UUID userId = SecurityUtils.requireCurrentUser().getUserId();
        reviewService.deleteReview(reviewId, userId);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .code(200)
                .message("Delete review successfully")
                .build());
    }
}

