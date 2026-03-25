package org.rent.room.be.service;

import org.rent.room.be.dto.request.CreatePackageRequest;
import org.rent.room.be.dto.request.UpdatePackageRequest;
import org.rent.room.be.dto.response.PackageResponse;

import java.util.List;
import java.util.UUID;

public interface PackageService {
    PackageResponse createPackage(CreatePackageRequest request);
    List<PackageResponse> getAllPackages();
    PackageResponse getPackageById(UUID id);
    PackageResponse updatePackage(UUID id, UpdatePackageRequest request);
    void deletePackage(UUID id);
    void purchasePackage(UUID packageId);
}

