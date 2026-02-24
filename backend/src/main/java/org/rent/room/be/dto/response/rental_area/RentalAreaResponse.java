package org.rent.room.be.dto.response.rental_area;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RentalAreaResponse {
    UUID rentalAreaId;
    String rentalAreaName;
    String address;
    String contactName;
    String contactPhone;
    String status;
    Long cityId;
    String cityName;
    List<RentalAreaImageResponse> images;
}
