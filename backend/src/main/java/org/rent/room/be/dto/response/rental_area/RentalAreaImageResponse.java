package org.rent.room.be.dto.response.rental_area;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RentalAreaImageResponse {
    UUID rentalAreaImageId;
    String imageUrl;
    Boolean isCover;
    Integer sortOrder;
}
