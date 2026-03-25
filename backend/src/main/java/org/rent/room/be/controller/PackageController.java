package org.rent.room.be.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.rent.room.be.base.ApiResponse;
import org.rent.room.be.dto.request.CreatePackageRequest;
import org.rent.room.be.dto.request.UpdatePackageRequest;
import org.rent.room.be.dto.response.PackageResponse;
import org.rent.room.be.service.PackageService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping
@RequiredArgsConstructor
@Tag(name = "Packages")
public class PackageController {

    private final PackageService packageService;

    // Admin endpoints
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin/packages")
    public ResponseEntity<ApiResponse<PackageResponse>> createPackage(@RequestBody CreatePackageRequest request) {
        PackageResponse createdPackage = packageService.createPackage(request);
        return ResponseEntity.ok(
                ApiResponse.<PackageResponse>builder()
                        .code(201)
                        .message("Package created successfully")
                        .result(createdPackage)
                        .build()
        );
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/packages")
    public ResponseEntity<ApiResponse<List<PackageResponse>>> getAllPackagesAdmin() {
        List<PackageResponse> packages = packageService.getAllPackages();
        return ResponseEntity.ok(
                ApiResponse.<List<PackageResponse>>builder()
                        .code(200)
                        .message("Get all packages successfully")
                        .result(packages)
                        .build()
        );
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/packages/{id}")
    public ResponseEntity<ApiResponse<PackageResponse>> getPackageByIdAdmin(@PathVariable UUID id) {
        PackageResponse pkg = packageService.getPackageById(id);
        return ResponseEntity.ok(
                ApiResponse.<PackageResponse>builder()
                        .code(200)
                        .message("Get package by id successfully")
                        .result(pkg)
                        .build()
        );
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/admin/packages/{id}")
    public ResponseEntity<ApiResponse<PackageResponse>> updatePackage(@PathVariable UUID id, @RequestBody UpdatePackageRequest request) {
        PackageResponse updatedPackage = packageService.updatePackage(id, request);
        return ResponseEntity.ok(
                ApiResponse.<PackageResponse>builder()
                        .code(200)
                        .message("Package updated successfully")
                        .result(updatedPackage)
                        .build()
        );
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/admin/packages/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePackage(@PathVariable UUID id) {
        packageService.deletePackage(id);
        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .code(200)
                        .message("Package deleted successfully")
                        .build()
        );
    }

    // Customer endpoints
    @GetMapping("/packages")
    public ResponseEntity<ApiResponse<List<PackageResponse>>> getAllPackages() {
        List<PackageResponse> packages = packageService.getAllPackages();
        return ResponseEntity.ok(
                ApiResponse.<List<PackageResponse>>builder()
                        .code(200)
                        .message("Get all packages successfully")
                        .result(packages)
                        .build()
        );
    }

    @PostMapping("/packages/{id}/purchase")
    public ResponseEntity<ApiResponse<Void>> purchasePackage(@PathVariable UUID id) {
        packageService.purchasePackage(id);
        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .code(200)
                        .message("Package purchased successfully")
                        .build()
        );
    }
}

