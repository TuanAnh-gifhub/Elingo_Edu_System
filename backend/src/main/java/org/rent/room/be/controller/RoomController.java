package org.rent.room.be.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.base.ApiResponse;
import org.rent.room.be.dto.request.room.CreateRoomRequest;
import org.rent.room.be.dto.request.room.UpdateRoomRequest;
import org.rent.room.be.dto.response.room.RoomCardResponse;
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
@Tag(name = "5. Room")
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

    @GetMapping
    public ResponseEntity<ApiResponse<List<RoomResponse>>> getAllRooms() {
        List<RoomResponse> result = roomService.getAllRooms();

        ApiResponse<List<RoomResponse>> response = ApiResponse.<List<RoomResponse>>builder()
                .code(200)
                .message("Get all rooms successfully")
                .result(result)
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<List<RoomResponse>>> getMyRooms(
            @AuthenticationPrincipal UserDetails principal
    ) {
        UUID currentUserId = null;

        if (principal instanceof CustomUserDetails customUserDetails) {
            currentUserId = customUserDetails.getUserId();
        }
        if (currentUserId == null) {
            throw new RuntimeException("User not authenticated");
        }

        List<RoomResponse> result = roomService.getRoomsByUserId(currentUserId);

        ApiResponse<List<RoomResponse>> response = ApiResponse.<List<RoomResponse>>builder()
                .code(200)
                .message("Get my rooms successfully")
                .result(result)
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/rental-areas/{rentalAreaId}")
    public ResponseEntity<ApiResponse<List<RoomCardResponse>>> getRoomsByRentalArea(
            @PathVariable UUID rentalAreaId
    ) {
        List<RoomCardResponse> result = roomService.getRoomsByRentalArea(rentalAreaId);

        ApiResponse<List<RoomCardResponse>> response = ApiResponse.<List<RoomCardResponse>>builder()
                .code(200)
                .message("Get rooms by rental area successfully")
                .result(result)
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{roomId}")
    public ResponseEntity<ApiResponse<RoomResponse>> getRoomDetail(@PathVariable UUID roomId) {
        RoomResponse result = roomService.getRoomDetail(roomId);

        ApiResponse<RoomResponse> response = ApiResponse.<RoomResponse>builder()
                .code(200)
                .message("Get room detail successfully")
                .result(result)
                .build();

        return ResponseEntity.ok(response);
    }

    @PutMapping(value = "/{roomId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<RoomResponse>> updateRoom(
            @PathVariable UUID roomId,
            @Valid @ModelAttribute UpdateRoomRequest request,
            @RequestPart(value = "images", required = false) MultipartFile[] images,
            @AuthenticationPrincipal UserDetails principal
    ) {
        UUID currentUserId = null;
        if (principal instanceof CustomUserDetails customUserDetails) {
            currentUserId = customUserDetails.getUserId();
        }
        if (currentUserId == null) throw new RuntimeException("User not authenticated");

        List<MultipartFile> imageList = (images == null) ? List.of() : List.of(images);
        RoomResponse result = roomService.updateRoom(roomId, request, imageList, currentUserId);

        ApiResponse<RoomResponse> response = ApiResponse.<RoomResponse>builder()
                .code(200)
                .message("Update room successfully")
                .result(result)
                .build();

        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{roomId}/status")
    public ResponseEntity<ApiResponse<RoomResponse>> updateRoomStatus(
            @PathVariable UUID roomId,
            @RequestParam String status,
            @AuthenticationPrincipal UserDetails principal
    ) {
        UUID currentUserId = null;
        if (principal instanceof CustomUserDetails customUserDetails) {
            currentUserId = customUserDetails.getUserId();
        }
        if (currentUserId == null) throw new RuntimeException("User not authenticated");

        RoomResponse result = roomService.updateRoomStatus(roomId, status, currentUserId);

        ApiResponse<RoomResponse> response = ApiResponse.<RoomResponse>builder()
                .code(200)
                .message("Update room status successfully")
                .result(result)
                .build();

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{roomId}")
    public ResponseEntity<ApiResponse<Void>> deleteRoom(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal UserDetails principal
    ) {
        UUID currentUserId = null;
        if (principal instanceof CustomUserDetails customUserDetails) {
            currentUserId = customUserDetails.getUserId();
        }
        if (currentUserId == null) throw new RuntimeException("User not authenticated");

        roomService.deleteRoom(roomId, currentUserId);

        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .code(200)
                .message("Delete room successfully")
                .result(null)
                .build();

        return ResponseEntity.ok(response);
    }






}
