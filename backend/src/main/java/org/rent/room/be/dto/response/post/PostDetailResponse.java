package org.rent.room.be.dto.response.post;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.dto.response.rental_area.RentalAreaResponse;
import org.rent.room.be.dto.response.room.RoomResponse;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PostDetailResponse {

    UUID postId;
    String title;
    String content;
    String postStatus;

    RoomResponse room;
    RentalAreaResponse rentalArea;
}
