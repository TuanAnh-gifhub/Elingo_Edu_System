package org.rent.room.be.dto.response.subscription;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PackageResponse {

    UUID packageId;
    String name;
    String description;
    BigDecimal price;
    int durationDays;
    Integer maxClassesPerMonth;
    Integer maxCourses;
    boolean active;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
