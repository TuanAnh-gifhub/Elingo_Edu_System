package org.rent.room.be.dto.request.subscription;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreatePackageRequest {

    @NotBlank(message = "Package name is required")
    String name;

    String description;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
    BigDecimal price;

    @NotNull(message = "Duration days is required")
    @Min(value = 1, message = "Duration must be at least 1 day")
    Integer durationDays;

    Integer maxClassesPerMonth;

    Integer maxCourses;
}
