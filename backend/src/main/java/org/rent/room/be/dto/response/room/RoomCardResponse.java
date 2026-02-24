package org.rent.room.be.dto.response.room;

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
public class RoomCardResponse {
    UUID roomId;
    UUID rentalAreaId;
    String roomName;
    String roomStatus;

    String coverImageUrl;

    BigDecimal price;
    Integer capacity;
}
