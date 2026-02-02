package org.rent.room.be.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.base.ApiResponse;
import org.rent.room.be.dto.request.rental_area.CreateRentalAreaRequest;
import org.rent.room.be.dto.response.rental_area.RentalAreaResponse;
import org.rent.room.be.security.CustomUserDetails;
import org.rent.room.be.service.RentalAreaService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;


@RestController
@RequiredArgsConstructor
@RequestMapping("/rental-areas")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Tag(name = "4. Rental Area", description = "API quản lý tòa nhà")
public class RentalAreaController {

    RentalAreaService rentalAreaService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<RentalAreaResponse>> createRentalArea(
            @Valid @ModelAttribute CreateRentalAreaRequest request,
            @RequestPart("images") MultipartFile[] images,
            @AuthenticationPrincipal UserDetails principal
    ) {

        UUID currentUserId = null;

        if (principal instanceof CustomUserDetails customUserDetails) {
            currentUserId = customUserDetails.getUserId();
        }

        if (currentUserId == null) {
            throw new RuntimeException("User not authenticated");
        }

        System.out.println("images length = " + (images == null ? 0 : images.length));
        System.out.println("cityId = " + request.getCityId());

        RentalAreaResponse result =
                rentalAreaService.createRentalArea(request, List.of(images), currentUserId);

        ApiResponse<RentalAreaResponse> response = ApiResponse.<RentalAreaResponse>builder()
                .code(200)
                .message("Create rental area successfully")
                .result(result)
                .build();

        return ResponseEntity.ok(response);
    }
}

