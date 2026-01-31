package org.rent.room.be.controller;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.base.ApiResponse;
import org.rent.room.be.common.ResponseBuilder;
import org.rent.room.be.dto.request.packages.RentPackageRequest;
import org.rent.room.be.dto.response.RentPackageResponse;
import org.rent.room.be.facade.PackageFacade;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;

@RequiredArgsConstructor
@RestController
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/api/packages")
@Validated
public class PackageController {
    PackageFacade packageFacade;

    @PostMapping
    public ResponseEntity<ApiResponse<RentPackageResponse>> createPackage(
            @Valid @RequestBody RentPackageRequest request) {
        RentPackageResponse response = packageFacade.createRentPackage(request);
        return ResponseBuilder.created(response, "/api/packages/" + response.getRentPackageId());
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<RentPackageResponse>>> list() {
        return ResponseBuilder.success(packageFacade.getAllPackages(), "OK");
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RentPackageResponse>> get(@PathVariable UUID id) {
        return ResponseBuilder.success(packageFacade.getPackageById(id), "OK");
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<RentPackageResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody RentPackageRequest request) {
        return ResponseBuilder.success(packageFacade.updatePackage(id, request), "Updated");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        packageFacade.deletePackage(id);
        return ResponseBuilder.success(null, "Deleted");
    }
}
