package org.rent.room.be.dto.request.subscription;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdatePackageRequest {

    String name;

    String description;

    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
    BigDecimal price;

    @Min(value = 1, message = "Duration must be at least 1 day")
    Integer durationDays;

    Integer maxClassesPerMonth;

    Integer maxCourses;

    Boolean active;
}
