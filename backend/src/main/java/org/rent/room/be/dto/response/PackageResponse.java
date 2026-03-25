package org.rent.room.be.dto.response;

import lombok.Data;

import java.util.UUID;

@Data
public class PackageResponse {
    private UUID packageId;
    private String name;
    private String description;
    private Double price;
    private Integer durationInDays;
}

