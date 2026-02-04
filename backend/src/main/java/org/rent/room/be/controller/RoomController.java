package org.rent.room.be.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.base.ApiResponse;
import org.rent.room.be.dto.request.room.CreateRoomRequest;
import org.rent.room.be.dto.response.room.RoomResponse;
import org.rent.room.be.security.CustomUserDetails;
import org.rent.room.be.service.RoomService;
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
@RequestMapping("/rooms")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Tag(name = "5. Room", description = "API quản lý phòng học")
public class RoomController {

    RoomService roomService;

    @PostMapping(value = "/{rentalAreaId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<RoomResponse>> createRoom(
            @PathVariable UUID rentalAreaId,
            @Valid @ModelAttribute CreateRoomRequest request,
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

        RoomResponse result = roomService.createRoom(rentalAreaId, request, List.of(images), currentUserId);

        ApiResponse<RoomResponse> response = ApiResponse.<RoomResponse>builder()
                .code(200)
                .message("Create room successfully")
                .result(result)
                .build();

        return ResponseEntity.ok(response);
    }
}
