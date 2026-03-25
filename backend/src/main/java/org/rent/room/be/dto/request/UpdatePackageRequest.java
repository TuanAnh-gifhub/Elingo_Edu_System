package org.rent.room.be.dto.request;

import lombok.Data;

@Data
public class UpdatePackageRequest {
    private String name;
    private String description;
    private Double price;
    private Integer durationInDays;
}

