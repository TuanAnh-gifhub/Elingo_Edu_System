package org.rent.room.be.dto.request.rental_area;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.constant.RentalAreaStatus;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateRentalAreaStatusRequest {

    @NotNull
    RentalAreaStatus status;
}
