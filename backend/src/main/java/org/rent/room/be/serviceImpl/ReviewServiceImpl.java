package org.rent.room.be.serviceImpl;

import lombok.RequiredArgsConstructor;
import org.rent.room.be.base.PageResponse;
import org.rent.room.be.dto.request.review.CreateReviewRequest;
import org.rent.room.be.dto.request.review.UpdateReviewRequest;
import org.rent.room.be.dto.response.review.ReviewResponse;
import org.rent.room.be.dto.response.review.ReviewSummaryResponse;
import org.rent.room.be.entity.ClassRoom;
import org.rent.room.be.entity.Review;
import org.rent.room.be.entity.User;
import org.rent.room.be.exception.AppException;
import org.rent.room.be.exception.ErrorCode;
import org.rent.room.be.mapper.ReviewMapper;
import org.rent.room.be.repository.ClassRoomRepository;
import org.rent.room.be.repository.ReviewRepository;
import org.rent.room.be.repository.UserRepository;
import org.rent.room.be.service.ReviewService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final ClassRoomRepository classRoomRepository;
    private final ReviewMapper reviewMapper;

    @Override
    @Transactional
    public ReviewResponse createReview(UUID userId, UUID classId, CreateReviewRequest request) {
        User user = userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        ClassRoom classRoom = null;
        if (classId != null) {
            classRoom = classRoomRepository.findById(classId).orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));
            if (!classRoom.isActive()) throw new AppException(ErrorCode.CLASS_NOT_FOUND);
        }

        Review review = Review.builder()
                .author(user)
                .classRoom(classRoom)
                .rating(request.getRating())
                .comment(request.getComment())
                .active(true)
                .build();

        Review saved = reviewRepository.save(review);
        return reviewMapper.toResponse(saved);
    }

    @Override
    public PageResponse<ReviewResponse> getReviewsByClass(UUID classId, int page, int size) {
        ClassRoom classRoom = classRoomRepository.findById(classId).orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));
        if (!classRoom.isActive()) throw new AppException(ErrorCode.CLASS_NOT_FOUND);

        PageRequest pageable = PageRequest.of(Math.max(0, page), Math.max(1, size));
        Page<Review> reviews = reviewRepository.findByClassRoomAndActiveTrueOrderByCreatedAtDesc(classRoom, pageable);

        PageResponse.PageResponseBuilder<ReviewResponse> builder = PageResponse.<ReviewResponse>builder();
        PageResponse<ReviewResponse> response = builder
                .currentPage(reviews.getNumber())
                .totalPages(reviews.getTotalPages())
                .pageSize(reviews.getSize())
                .totalElements(reviews.getTotalElements())
                .data(reviews.stream().map(reviewMapper::toResponse).collect(Collectors.toList()))
                .build();
        return response;
    }

    @Override
    public PageResponse<ReviewResponse> getGlobalReviews(int page, int size) {
        PageRequest pageable = PageRequest.of(Math.max(0, page), Math.max(1, size));
        Page<Review> reviews = reviewRepository.findGlobalReviews(pageable);

        PageResponse<ReviewResponse> response = PageResponse.<ReviewResponse>builder()
                .currentPage(reviews.getNumber())
                .totalPages(reviews.getTotalPages())
                .pageSize(reviews.getSize())
                .totalElements(reviews.getTotalElements())
                .data(reviews.stream().map(reviewMapper::toResponse).collect(Collectors.toList()))
                .build();
        return response;
    }

    @Override
    public PageResponse<ReviewResponse> getAdminReviews(int page, int size) {
        PageRequest pageable = PageRequest.of(Math.max(0, page), Math.max(1, size));
        Page<Review> reviews = reviewRepository.findByActiveTrueOrderByCreatedAtDesc(pageable);

        return PageResponse.<ReviewResponse>builder()
                .currentPage(reviews.getNumber())
                .totalPages(reviews.getTotalPages())
                .pageSize(reviews.getSize())
                .totalElements(reviews.getTotalElements())
                .data(reviews.stream().map(reviewMapper::toResponse).collect(Collectors.toList()))
                .build();
    }

    @Override
    public ReviewSummaryResponse getSummaryByClass(UUID classId) {
        ClassRoom classRoom = classRoomRepository.findById(classId).orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));
        if (!classRoom.isActive()) throw new AppException(ErrorCode.CLASS_NOT_FOUND);

        long total = reviewRepository.countByClassRoomAndActiveTrue(classRoom);
        Double avg = reviewRepository.averageRatingForClass(classRoom);
        double average = avg == null ? 0.0 : avg;
        return ReviewSummaryResponse.builder()
                .averageRating(average)
                .totalReviews(total)
                .build();
    }

    @Override
    @Transactional
    public ReviewResponse updateReview(UUID reviewId, UUID userId, UpdateReviewRequest request) {
        Review review = reviewRepository.findById(reviewId).orElseThrow(() -> new AppException(ErrorCode.REVIEW_NOT_FOUND));
        if (!review.isActive()) throw new AppException(ErrorCode.REVIEW_NOT_FOUND);

        if (!review.getAuthor().getUserId().equals(userId)) {
            User user = userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
            boolean isAdmin = user.getRole() != null && "ROLE_ADMIN".equals(user.getRole().getRoleName());
            if (!isAdmin) {
                throw new AppException(ErrorCode.UNAUTHORIZED);
            }
        }

        if (request.getRating() != null) review.setRating(request.getRating());
        if (request.getComment() != null) review.setComment(request.getComment());

        return reviewMapper.toResponse(reviewRepository.save(review));
    }

    @Override
    @Transactional
    public void deleteReview(UUID reviewId, UUID userId) {
        Review review = reviewRepository.findById(reviewId).orElseThrow(() -> new AppException(ErrorCode.REVIEW_NOT_FOUND));
        if (!review.isActive()) throw new AppException(ErrorCode.REVIEW_NOT_FOUND);

        if (!review.getAuthor().getUserId().equals(userId)) {
            User user = userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
            boolean isAdmin = user.getRole() != null && "ROLE_ADMIN".equals(user.getRole().getRoleName());
            if (!isAdmin) {
                throw new AppException(ErrorCode.UNAUTHORIZED);
            }
        }

        review.setActive(false);
        reviewRepository.save(review);
    }
}

