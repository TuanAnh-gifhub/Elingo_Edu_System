package org.rent.room.be.service;

import org.rent.room.be.dto.request.rental_area.CreateRentalAreaRequest;
import org.rent.room.be.dto.response.rental_area.RentalAreaResponse;
import org.rent.room.be.dto.request.rental_area.UpdateRentalAreaRequest;
import org.rent.room.be.dto.request.rental_area.UpdateRentalAreaStatusRequest;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

public interface RentalAreaService {
    RentalAreaResponse createRentalArea(CreateRentalAreaRequest req, List<MultipartFile> images, UUID currentUserId);

    List<RentalAreaResponse> getAllRentalAreas();

    List<RentalAreaResponse> getRentalAreasByUserId(UUID userId);

    RentalAreaResponse getRentalAreaById(UUID rentalAreaId);

    void deleteRentalArea(UUID rentalAreaId, UUID currentUserId, String currentUserRole);

    RentalAreaResponse updateRentalArea(UUID rentalAreaId, UpdateRentalAreaRequest req,
                                        UUID currentUserId, String currentUserRole);

    RentalAreaResponse updateRentalAreaStatus(UUID rentalAreaId, UpdateRentalAreaStatusRequest req,
                                              UUID currentUserId, String currentUserRole);
}