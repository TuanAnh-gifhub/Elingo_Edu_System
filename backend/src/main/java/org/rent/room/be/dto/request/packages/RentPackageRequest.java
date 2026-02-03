package org.rent.room.be.dto.request.packages;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RentPackageRequest {

    @NotBlank(message = "packageName is required")
    private String rentPackageName;

    @NotNull(message = "price is required")
    @Min(value = 0, message = "price must be >= 0")
    private Double price;

    @NotNull(message = "durationDays is required")
    @Min(value = 0, message = "durationDays must be >= 0")
    private Integer durationDays;
}
