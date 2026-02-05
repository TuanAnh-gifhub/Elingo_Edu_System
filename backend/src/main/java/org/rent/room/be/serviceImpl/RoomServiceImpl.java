package org.rent.room.be.serviceImpl;

import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.constant.RoomStatus;
import org.rent.room.be.dto.internal.CloudinaryUploadResult;
import org.rent.room.be.dto.request.room.CreateRoomRequest;
import org.rent.room.be.dto.response.room.RoomImageResponse;
import org.rent.room.be.dto.response.room.RoomResponse;
import org.rent.room.be.entity.*;
import org.rent.room.be.repository.*;
import org.rent.room.be.service.CloudinaryService;
import org.rent.room.be.service.RoomService;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class RoomServiceImpl implements RoomService {

    RoomRepository roomRepository;
    RoomImageRepository roomImageRepository;
    RentalAreaRepository rentalAreaRepository;
    CategoryRepository categoryRepository;
    AmenityRepository amenityRepository;
    CloudinaryService cloudinaryService;

    @Override
    @Transactional
    public RoomResponse createRoom(UUID rentalAreaId, CreateRoomRequest req, List<MultipartFile> images, UUID currentUserId) {

        // validate images
        int count = images == null ? 0 : (int) images.stream().filter(f -> f != null && !f.isEmpty()).count();
        if (count < 1 || count > 5) {
            throw new IllegalArgumentException("Room requires 1 to 5 images");
        }

        // rentalArea tồn tại + check owner
        RentalArea rentalArea = rentalAreaRepository.findById(rentalAreaId)
                .orElseThrow(() -> new NoSuchElementException("RentalArea not found"));

        // Check owner
        UUID ownerId = rentalArea.getOwner().getUserId();
        if (ownerId == null || !ownerId.equals(currentUserId)) {
            throw new RuntimeException("Forbidden: not owner of this rental area");
        }

        // category
        Category category = null;
        if (req.getCategoryId() != null) {
            category = categoryRepository.findById(req.getCategoryId())
                    .orElseThrow(() -> new NoSuchElementException("Category not found"));
        }

        // amenities
        Set<Amenity> amenities = new HashSet<>();
        if (req.getAmenityIds() != null && !req.getAmenityIds().isEmpty()) {
            List<Amenity> found = amenityRepository.findAllById(req.getAmenityIds());
            if (found.size() != req.getAmenityIds().size()) {
                throw new IllegalArgumentException("Some amenities not found");
            }
            amenities.addAll(found);
        }

        // create Room
        Room room = Room.builder()
                .roomName(req.getRoomName())
                .description(req.getDescription())
                .price(req.getPrice())
                .capacity(req.getCapacity())
                .area(req.getArea())
                .roomStatus(RoomStatus.ACTIVE)
                .rentalArea(rentalArea)
                .category(category)
                .amenities(amenities)
                .build();

        room = roomRepository.save(room);

        // Upload images to Cloudinary
        // Folder: rentals/{rentalAreaId}/rooms/{roomId} để gọn theo RentalArea
        String folder = "rentals/" + rentalArea.getRentalAreaId() + "/rooms/" + room.getRoomId();
        List<CloudinaryUploadResult> uploaded = cloudinaryService.uploadImages(images, folder);

        // Save RoomImage
        List<RoomImage> entities = new ArrayList<>();
        for (int i = 0; i < uploaded.size(); i++) {
            CloudinaryUploadResult u = uploaded.get(i);

            RoomImage img = RoomImage.builder()
                    .room(room)
                    .imageUrl(u.getUrl())
                    .publicId(u.getPublicId())
                    .isCover(i == 0)
                    .sortOrder(i)
                    .build();

            entities.add(img);
        }
        roomImageRepository.saveAll(entities);

        List<RoomImageResponse> imageResponses = entities.stream()
                .sorted(Comparator.comparing(RoomImage::getSortOrder, Comparator.nullsLast(Integer::compareTo)))
                .map(img -> RoomImageResponse.builder()
                        .roomImageId(img.getRoomImageId())
                        .imageUrl(img.getImageUrl())
                        .isCover(img.getIsCover())
                        .sortOrder(img.getSortOrder())
                        .build())
                .collect(Collectors.toList());

        Set<RoomResponse.AmenityItem> amenityItems = amenities.stream()
                .map(a -> RoomResponse.AmenityItem.builder()
                        .amenityId(a.getAmenityId())
                        .amenityName(a.getAmenityName())
                        .build())
                .collect(Collectors.toSet());

        return RoomResponse.builder()
                .roomId(room.getRoomId())
                .rentalAreaId(rentalArea.getRentalAreaId())
                .roomName(room.getRoomName())
                .description(room.getDescription())
                .price(room.getPrice())
                .roomStatus(room.getRoomStatus() != null ? room.getRoomStatus().name() : null)
                .capacity(room.getCapacity())
                .area(room.getArea())
                .categoryId(category != null ? category.getCategoryId() : null)
                .categoryName(category != null ? category.getCategoryName() : null)
                .amenities(amenityItems)
                .images(imageResponses)
                .build();
    }

    @Override
    public List<RoomResponse> getAllRooms() {
        List<Room> rooms = roomRepository.findAllNotInactive();
        return rooms.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<RoomResponse> getRoomsByUserId(UUID userId) {
        List<Room> rooms = roomRepository.findByOwnerIdNotInactive(userId);
        return rooms.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private RoomResponse mapToResponse(Room room) {
        // images
        List<RoomImageResponse> imageResponses = roomImageRepository.findByRoom(room)
                .stream()
                .sorted(Comparator.comparing(RoomImage::getSortOrder, Comparator.nullsLast(Integer::compareTo)))
                .map(img -> RoomImageResponse.builder()
                        .roomImageId(img.getRoomImageId())
                        .imageUrl(img.getImageUrl())
                        .isCover(img.getIsCover())
                        .sortOrder(img.getSortOrder())
                        .build())
                .collect(Collectors.toList());

        // amenities + category
        Set<RoomResponse.AmenityItem> amenityItems = (room.getAmenities() == null ? Set.<Amenity>of() : room.getAmenities())
                .stream()
                .map(a -> RoomResponse.AmenityItem.builder()
                        .amenityId(a.getAmenityId())
                        .amenityName(a.getAmenityName())
                        .build())
                .collect(Collectors.toSet());

        Category category = room.getCategory();

        return RoomResponse.builder()
                .roomId(room.getRoomId())
                .rentalAreaId(room.getRentalArea() != null ? room.getRentalArea().getRentalAreaId() : null)
                .roomName(room.getRoomName())
                .description(room.getDescription())
                .price(room.getPrice())
                .roomStatus(room.getRoomStatus() != null ? room.getRoomStatus().name() : null)
                .capacity(room.getCapacity())
                .area(room.getArea())
                .categoryId(category != null ? category.getCategoryId() : null)
                .categoryName(category != null ? category.getCategoryName() : null)
                .amenities(amenityItems)
                .images(imageResponses)
                .build();
    }

}
