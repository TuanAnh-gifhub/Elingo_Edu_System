package org.rent.room.be.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.base.ApiResponse;
import org.rent.room.be.common.ResponseBuilder;
import org.rent.room.be.dto.request.packages.RentPackageRequest;
import org.rent.room.be.dto.response.RentPackageResponse;
import org.rent.room.be.facade.PackageFacade;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;

@RequiredArgsConstructor
@RestController
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/packages")
@Validated
@Tag(name = "6. Package")
public class PackageController {
    PackageFacade packageFacade;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
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
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<RentPackageResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody RentPackageRequest request) {
        return ResponseBuilder.success(packageFacade.updatePackage(id, request), "Updated");
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        packageFacade.deletePackage(id);
        return ResponseBuilder.success(null, "Deleted");
    }
}
