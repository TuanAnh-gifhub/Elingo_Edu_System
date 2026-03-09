package org.rent.room.be.service;

import org.rent.room.be.base.PageResponse;
import org.rent.room.be.dto.request.review.CreateReviewRequest;
import org.rent.room.be.dto.request.review.UpdateReviewRequest;
import org.rent.room.be.dto.response.review.ReviewResponse;
import org.rent.room.be.dto.response.review.ReviewSummaryResponse;

import java.util.UUID;

public interface ReviewService {

    ReviewResponse createReview(UUID userId, UUID classId, CreateReviewRequest request);

    PageResponse<ReviewResponse> getReviewsByClass(UUID classId, int page, int size);

    PageResponse<ReviewResponse> getGlobalReviews(int page, int size);

    ReviewSummaryResponse getSummaryByClass(UUID classId);

    ReviewResponse updateReview(UUID reviewId, UUID userId, UpdateReviewRequest request);

    void deleteReview(UUID reviewId, UUID userId);
}

