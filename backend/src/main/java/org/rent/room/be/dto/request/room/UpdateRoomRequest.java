package org.rent.room.be.dto.request.room;

import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateRoomRequest {

    @Size(max = 100)
    String roomName;

    String description;

    BigDecimal price;
    Integer capacity;
    Double area;

    Integer categoryId;
    Set<Long> amenityIds;

    Boolean replaceImages;
}
