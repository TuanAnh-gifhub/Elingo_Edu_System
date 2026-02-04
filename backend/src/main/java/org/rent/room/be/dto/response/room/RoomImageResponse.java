package org.rent.room.be.dto.response.room;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RoomImageResponse {
    UUID roomImageId;
    String imageUrl;
    Boolean isCover;
    Integer sortOrder;
}
