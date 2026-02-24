package org.rent.room.be.dto.request.amenity;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateAmenityRequest {

    @NotBlank
    @Size(max = 100)
    String amenityName;

    @NotBlank
    @Size(max = 50)
    String iconKey;
}
