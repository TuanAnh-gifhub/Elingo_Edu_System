package org.rent.room.be.dto.request.rental_area;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.constant.RentalAreaStatus;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateRentalAreaRequest {
    @NotBlank
    String rentalAreaName;

    @NotBlank
    String address;

    String contactName;

    String contactPhone;

    @NotNull
    Long cityId;

    RentalAreaStatus status;
}
