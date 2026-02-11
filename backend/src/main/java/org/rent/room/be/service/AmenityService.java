package org.rent.room.be.service;

import org.rent.room.be.dto.request.amenity.CreateAmenityRequest;
import org.rent.room.be.dto.request.amenity.UpdateAmenityRequest;
import org.rent.room.be.dto.response.amenity.AmenityResponse;

import java.util.List;

public interface AmenityService {
    AmenityResponse createAmenity(CreateAmenityRequest request);
    AmenityResponse updateAmenity(Long amenityId, UpdateAmenityRequest request);
    void deleteAmenity(Long amenityId);
    AmenityResponse getAmenityById(Long amenityId);
    List<AmenityResponse> getAllAmenities();
}
