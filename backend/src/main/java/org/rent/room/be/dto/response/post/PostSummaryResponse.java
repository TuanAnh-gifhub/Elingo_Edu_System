package org.rent.room.be.dto.response.post;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PostSummaryResponse {

    UUID postId;
    String title;
    String postStatus;

    // room summary
    UUID roomId;
    String roomName;
    BigDecimal price;
    Integer capacity;
    Double area;
    String roomCoverImageUrl;

    // rental area summary
    UUID rentalAreaId;
    String rentalAreaName;
    String address;
    String rentalAreaCoverImageUrl;
}
