package org.rent.room.be.serviceImpl;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.constant.RentalAreaStatus;
import org.rent.room.be.dto.internal.CloudinaryUploadResult;
import org.rent.room.be.dto.request.rental_area.CreateRentalAreaRequest;
import org.rent.room.be.dto.response.rental_area.RentalAreaImageResponse;
import org.rent.room.be.dto.response.rental_area.RentalAreaResponse;
import org.rent.room.be.entity.City;
import org.rent.room.be.entity.RentalArea;
import org.rent.room.be.entity.RentalAreaImage;
import org.rent.room.be.entity.User;
import org.rent.room.be.exception.AppException;
import org.rent.room.be.exception.ErrorCode;
import org.rent.room.be.repository.CityRepository;
import org.rent.room.be.repository.RentalAreaImageRepository;
import org.rent.room.be.repository.RentalAreaRepository;
import org.rent.room.be.repository.UserRepository;
import org.rent.room.be.service.CloudinaryService;
import org.rent.room.be.service.RentalAreaService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class RentalAreaServiceImpl implements RentalAreaService {

    RentalAreaRepository rentalAreaRepository;
    RentalAreaImageRepository rentalAreaImageRepository;
    CityRepository cityRepository;
    UserRepository userRepository;
    CloudinaryService cloudinaryService;

    @Override
    @Transactional
    public RentalAreaResponse createRentalArea(CreateRentalAreaRequest req, List<MultipartFile> images, UUID currentUserId) {

        int count = images == null ? 0 : (int) images.stream().filter(f -> f != null && !f.isEmpty()).count();
        if (count < 1 || count > 5) {
            throw new IllegalArgumentException("RentalArea requires 1 to 5 images");
        }

        User owner = userRepository.findById(currentUserId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        City city = cityRepository.findById(req.getCityId())
                .orElseThrow(() -> new NoSuchElementException("City not found"));

        RentalArea rentalArea = RentalArea.builder()
                .rentalAreaName(req.getRentalAreaName())
                .address(req.getAddress())
                .contactName(req.getContactName())
                .contactPhone(req.getContactPhone())
                .status(req.getStatus() != null ? req.getStatus() : RentalAreaStatus.ACTIVE)
                .city(city)
                .owner(owner)
                .build();

        rentalArea = rentalAreaRepository.save(rentalArea);

        String folder = "rentals/" + rentalArea.getRentalAreaId();

        List<CloudinaryUploadResult> uploaded = cloudinaryService.uploadImages(images, folder);

        List<RentalAreaImage> entities = new ArrayList<>();
        for (int i = 0; i < uploaded.size(); i++) {
            CloudinaryUploadResult u = uploaded.get(i);

            RentalAreaImage img = RentalAreaImage.builder()
                    .rentalArea(rentalArea)
                    .imageUrl(u.getUrl())
                    .publicId(u.getPublicId())
                    .isCover(i == 0)     // ảnh đầu tiên làm cover
                    .sortOrder(i)
                    .build();

            entities.add(img);
        }

        rentalAreaImageRepository.saveAll(entities);

        List<RentalAreaImageResponse> imageResponses = entities.stream()
                .sorted(Comparator.comparing(RentalAreaImage::getSortOrder, Comparator.nullsLast(Integer::compareTo)))
                .map(img -> RentalAreaImageResponse.builder()
                        .rentalAreaImageId(img.getRentalAreaImageId())
                        .imageUrl(img.getImageUrl())
                        .isCover(img.getIsCover())
                        .sortOrder(img.getSortOrder())
                        .build())
                .collect(Collectors.toList());


        return RentalAreaResponse.builder()
                .rentalAreaId(rentalArea.getRentalAreaId())
                .rentalAreaName(rentalArea.getRentalAreaName())
                .address(rentalArea.getAddress())
                .contactName(rentalArea.getContactName())
                .contactPhone(rentalArea.getContactPhone())
                .status(rentalArea.getStatus().name())
                .images(imageResponses)
                .build();
    }

    @Override
    public List<RentalAreaResponse> getAllRentalAreas() {
        List<RentalArea> rentalAreas = rentalAreaRepository.findAllActive();
        return rentalAreas.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<RentalAreaResponse> getRentalAreasByUserId(UUID userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        List<RentalArea> rentalAreas = rentalAreaRepository.findByOwnerId(userId);
        return rentalAreas.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public RentalAreaResponse getRentalAreaById(UUID rentalAreaId) {
        RentalArea rentalArea = rentalAreaRepository.findByIdActive(rentalAreaId)
                .orElseThrow(() -> new AppException(ErrorCode.RENTAL_AREA_NOT_FOUND));
        return mapToResponse(rentalArea);
    }

    private RentalAreaResponse mapToResponse(RentalArea rentalArea) {
        List<RentalAreaImageResponse> imageResponses = rentalAreaImageRepository.findByRentalArea(rentalArea)
                .stream()
                .sorted(Comparator.comparing(RentalAreaImage::getSortOrder, Comparator.nullsLast(Integer::compareTo)))
                .map(img -> RentalAreaImageResponse.builder()
                        .rentalAreaImageId(img.getRentalAreaImageId())
                        .imageUrl(img.getImageUrl())
                        .isCover(img.getIsCover())
                        .sortOrder(img.getSortOrder())
                        .build())
                .collect(Collectors.toList());

        return RentalAreaResponse.builder()
                .rentalAreaId(rentalArea.getRentalAreaId())
                .rentalAreaName(rentalArea.getRentalAreaName())
                .address(rentalArea.getAddress())
                .contactName(rentalArea.getContactName())
                .contactPhone(rentalArea.getContactPhone())
                .status(rentalArea.getStatus().name())
                .images(imageResponses)
                .build();
    }

    @Override
    @Transactional
    public void deleteRentalArea(UUID rentalAreaId, UUID currentUserId, String currentUserRole) {
        RentalArea rentalArea = rentalAreaRepository.findByIdActive(rentalAreaId)
                .orElseThrow(() -> new AppException(ErrorCode.RENTAL_AREA_NOT_FOUND));

        boolean isAdmin = "ADMIN".equalsIgnoreCase(currentUserRole);

        if (!isAdmin && !rentalArea.getOwner().getUserId().equals(currentUserId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        rentalArea.setDeletedAt(LocalDateTime.now());
        rentalAreaRepository.save(rentalArea);
    }
}
