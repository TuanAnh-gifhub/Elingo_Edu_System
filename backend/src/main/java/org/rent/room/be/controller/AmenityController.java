package org.rent.room.be.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.base.ApiResponse;
import org.rent.room.be.dto.request.amenity.CreateAmenityRequest;
import org.rent.room.be.dto.request.amenity.UpdateAmenityRequest;
import org.rent.room.be.dto.response.amenity.AmenityResponse;
import org.rent.room.be.service.AmenityService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/amenities")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Tag(name = "10. Amenity")
public class AmenityController {

    AmenityService amenityService;

    @PostMapping
    public ResponseEntity<ApiResponse<AmenityResponse>> createAmenity(
            @Valid @RequestBody CreateAmenityRequest request
    ) {
        AmenityResponse result = amenityService.createAmenity(request);

        ApiResponse<AmenityResponse> response = ApiResponse.<AmenityResponse>builder()
                .code(200)
                .message("Create amenity successfully")
                .result(result)
                .build();

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{amenityId}")
    public ResponseEntity<ApiResponse<AmenityResponse>> updateAmenity(
            @PathVariable Long amenityId,
            @Valid @RequestBody UpdateAmenityRequest request
    ) {
        AmenityResponse result = amenityService.updateAmenity(amenityId, request);

        ApiResponse<AmenityResponse> response = ApiResponse.<AmenityResponse>builder()
                .code(200)
                .message("Update amenity successfully")
                .result(result)
                .build();

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{amenityId}")
    public ResponseEntity<ApiResponse<Void>> deleteAmenity(
            @PathVariable Long amenityId
    ) {
        amenityService.deleteAmenity(amenityId);

        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .code(200)
                .message("Delete amenity successfully")
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{amenityId}")
    public ResponseEntity<ApiResponse<AmenityResponse>> getAmenityById(
            @PathVariable Long amenityId
    ) {
        AmenityResponse result = amenityService.getAmenityById(amenityId);

        ApiResponse<AmenityResponse> response = ApiResponse.<AmenityResponse>builder()
                .code(200)
                .message("Get amenity successfully")
                .result(result)
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AmenityResponse>>> getAllAmenities() {
        List<AmenityResponse> result = amenityService.getAllAmenities();

        ApiResponse<List<AmenityResponse>> response = ApiResponse.<List<AmenityResponse>>builder()
                .code(200)
                .message("Get all amenities successfully")
                .result(result)
                .build();

        return ResponseEntity.ok(response);
    }
}
