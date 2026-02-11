package org.rent.room.be.serviceImpl;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.dto.request.amenity.CreateAmenityRequest;
import org.rent.room.be.dto.request.amenity.UpdateAmenityRequest;
import org.rent.room.be.dto.response.amenity.AmenityResponse;
import org.rent.room.be.entity.Amenity;
import org.rent.room.be.repository.AmenityRepository;
import org.rent.room.be.service.AmenityService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AmenityServiceImpl implements AmenityService {

    AmenityRepository amenityRepository;

    @Override
    public AmenityResponse createAmenity(CreateAmenityRequest request) {
        String name = request.getAmenityName() == null ? null : request.getAmenityName().trim();
        String iconKey = request.getIconKey() == null ? null : request.getIconKey().trim();

        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Amenity name is required");
        }
        if (iconKey == null || iconKey.isBlank()) {
            throw new IllegalArgumentException("Icon key is required");
        }

        if (amenityRepository.existsByAmenityName(name)) {
            throw new IllegalArgumentException("Amenity name already exists");
        }

        Amenity amenity = Amenity.builder()
                .amenityName(name)
                .iconKey(iconKey)
                .build();

        amenity = amenityRepository.save(amenity);
        return mapToResponse(amenity);
    }

    @Override
    public AmenityResponse updateAmenity(Long amenityId, UpdateAmenityRequest request) {
        Amenity amenity = amenityRepository.findById(amenityId)
                .orElseThrow(() -> new NoSuchElementException("Amenity not found"));

        String name = request.getAmenityName() == null ? null : request.getAmenityName().trim();
        String iconKey = request.getIconKey() == null ? null : request.getIconKey().trim();

        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Amenity name is required");
        }
        if (iconKey == null || iconKey.isBlank()) {
            throw new IllegalArgumentException("Icon key is required");
        }

        if (!amenity.getAmenityName().equalsIgnoreCase(name)
                && amenityRepository.existsByAmenityName(name)) {
            throw new IllegalArgumentException("Amenity name already exists");
        }

        amenity.setAmenityName(name);
        amenity.setIconKey(iconKey);

        amenity = amenityRepository.save(amenity);
        return mapToResponse(amenity);
    }

    @Override
    public void deleteAmenity(Long amenityId) {
        Amenity amenity = amenityRepository.findById(amenityId)
                .orElseThrow(() -> new NoSuchElementException("Amenity not found"));

        if (amenity.getRooms() != null && !amenity.getRooms().isEmpty()) {
            throw new IllegalArgumentException("Amenity is being used by rooms, cannot delete");
        }

        amenityRepository.delete(amenity);
    }

    @Override
    public AmenityResponse getAmenityById(Long amenityId) {
        Amenity amenity = amenityRepository.findById(amenityId)
                .orElseThrow(() -> new NoSuchElementException("Amenity not found"));
        return mapToResponse(amenity);
    }

    @Override
    public List<AmenityResponse> getAllAmenities() {
        return amenityRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private AmenityResponse mapToResponse(Amenity amenity) {
        return AmenityResponse.builder()
                .amenityId(amenity.getAmenityId())
                .amenityName(amenity.getAmenityName())
                .iconKey(amenity.getIconKey())
                .build();
    }
}
