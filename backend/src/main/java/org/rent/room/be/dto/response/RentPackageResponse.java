package org.rent.room.be.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RentPackageResponse {
    private UUID rentPackageId;
    private String rentPackageName;
    private double price;
    private int durationDays;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
