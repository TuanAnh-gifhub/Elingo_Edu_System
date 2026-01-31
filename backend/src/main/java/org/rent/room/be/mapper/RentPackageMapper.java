package org.rent.room.be.mapper;

import org.mapstruct.Mapper;
import org.rent.room.be.dto.request.packages.RentPackageRequest;
import org.rent.room.be.dto.response.RentPackageResponse;
import org.rent.room.be.entity.RentPackage;

import java.util.List;

@Mapper(componentModel = "spring")
public interface RentPackageMapper {

    RentPackage toEntity(RentPackageRequest request);

    RentPackageResponse toResponse(RentPackage pkg);

    List<RentPackageResponse> toResponseList(List<RentPackage> pkgs);
}
