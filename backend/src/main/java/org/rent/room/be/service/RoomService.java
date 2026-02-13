package org.rent.room.be.service;

import org.rent.room.be.dto.request.room.CreateRoomRequest;
import org.rent.room.be.dto.request.room.UpdateRoomRequest;
import org.rent.room.be.dto.response.room.RoomCardResponse;
import org.rent.room.be.dto.response.room.RoomResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

public interface RoomService {
    RoomResponse createRoom(UUID rentalAreaId, CreateRoomRequest req, List<MultipartFile> images, UUID currentUserId);

    List<RoomResponse> getAllRooms();

    List<RoomResponse> getRoomsByUserId(UUID userId);

    List<RoomCardResponse> getRoomsByRentalArea(UUID rentalAreaId);

    RoomResponse getRoomDetail(UUID roomId);

    RoomResponse updateRoom(UUID roomId, UpdateRoomRequest req, List<MultipartFile> images, UUID currentUserId);

    RoomResponse updateRoomStatus(UUID roomId, String status, UUID currentUserId);

    void deleteRoom(UUID roomId, UUID currentUserId);
}
