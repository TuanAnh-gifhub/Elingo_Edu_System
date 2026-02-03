package org.rent.room.be.facade;

import lombok.RequiredArgsConstructor;
import org.rent.room.be.dto.request.packages.RentPackageRequest;
import org.rent.room.be.dto.response.RentPackageResponse;
import org.rent.room.be.entity.RentPackage;
import org.rent.room.be.mapper.RentPackageMapper;
import org.rent.room.be.service.RentPackageService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PackageFacade {
    private final RentPackageService packageService;
    private final RentPackageMapper packageMapper;

    public RentPackageResponse createRentPackage(RentPackageRequest request) {
        RentPackage entity = packageMapper.toEntity(request);
        RentPackage created = packageService.createRentPackage(entity);
        return packageMapper.toResponse(created);
    }

    public List<RentPackageResponse> getAllPackages() {
        return packageMapper.toResponseList(packageService.getAllRentPackages());
    }

    public RentPackageResponse getPackageById(UUID id) {
        return packageMapper.toResponse(packageService.getRentPackageById(id));
    }

    public RentPackageResponse updatePackage(UUID id, RentPackageRequest request) {
        RentPackage toUpdate = packageMapper.toEntity(request);
        RentPackage updated = packageService.updateRentPackage(id, toUpdate);
        return packageMapper.toResponse(updated);
    }

    public void deletePackage(UUID id) {
        packageService.deleteRentPackage(id);
    }
}
