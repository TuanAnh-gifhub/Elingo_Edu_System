package org.rent.room.be.dto.response.review;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class ReviewSummaryResponse {
    double averageRating;
    long totalReviews;
}

