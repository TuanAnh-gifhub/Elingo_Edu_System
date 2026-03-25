package org.rent.room.be.serviceImpl;

import org.rent.room.be.dto.response.PackageResponse;
import org.rent.room.be.entity.Package;
import org.springframework.stereotype.Component;

@Component
public class PackageMapper {
    public PackageResponse toPackageResponse(Package pkg) {
        PackageResponse response = new PackageResponse();
        response.setPackageId(pkg.getPackageId());
        response.setName(pkg.getName());
        response.setDescription(pkg.getDescription());
        response.setPrice(pkg.getPrice());
        response.setDurationInDays(pkg.getDurationInDays());
        return response;
    }
}

