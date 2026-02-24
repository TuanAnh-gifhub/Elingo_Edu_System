package org.rent.room.be.serviceImpl;

import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.constant.RoomStatus;
import org.rent.room.be.dto.internal.CloudinaryUploadResult;
import org.rent.room.be.dto.request.room.CreateRoomRequest;
import org.rent.room.be.dto.request.room.UpdateRoomRequest;
import org.rent.room.be.dto.response.room.RoomCardResponse;
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

        int count = images == null ? 0 : (int) images.stream().filter(f -> f != null && !f.isEmpty()).count();
        if (count < 1 || count > 5) {
            throw new IllegalArgumentException("Room requires 1 to 5 images");
        }

        RentalArea rentalArea = rentalAreaRepository.findById(rentalAreaId)
                .orElseThrow(() -> new NoSuchElementException("RentalArea not found"));

        UUID ownerId = rentalArea.getOwner().getUserId();
        if (ownerId == null || !ownerId.equals(currentUserId)) {
            throw new RuntimeException("Forbidden: not owner of this rental area");
        }

        Category category = null;
        if (req.getCategoryId() != null) {
            category = categoryRepository.findById(req.getCategoryId())
                    .orElseThrow(() -> new NoSuchElementException("Category not found"));
        }

        Set<Amenity> amenities = new HashSet<>();
        if (req.getAmenityIds() != null && !req.getAmenityIds().isEmpty()) {
            List<Amenity> found = amenityRepository.findAllById(req.getAmenityIds());
            if (found.size() != req.getAmenityIds().size()) {
                throw new IllegalArgumentException("Some amenities not found");
            }
            amenities.addAll(found);
        }

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

        String folder = "rentals/" + rentalArea.getRentalAreaId() + "/rooms/" + room.getRoomId();
        List<CloudinaryUploadResult> uploaded = cloudinaryService.uploadImages(images, folder);

        List<RoomImage> entities = new ArrayList<>();
        for (int i = 0; i < uploaded.size(); i++) {
            CloudinaryUploadResult u = uploaded.get(i);
            entities.add(RoomImage.builder()
                    .room(room)
                    .imageUrl(u.getUrl())
                    .publicId(u.getPublicId())
                    .isCover(i == 0)
                    .sortOrder(i)
                    .build());
        }
        roomImageRepository.saveAll(entities);

        return mapToResponse(room);
    }

    @Override
    public List<RoomResponse> getAllRooms() {
        return roomRepository.findAllNotInactive()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<RoomResponse> getRoomsByUserId(UUID userId) {
        return roomRepository.findByOwnerIdNotInactive(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<RoomCardResponse> getRoomsByRentalArea(UUID rentalAreaId) {
        List<Room> rooms = roomRepository.findByRentalAreaIdNotInactive(rentalAreaId);
        if (rooms.isEmpty()) return List.of();

        List<RoomImage> allImages = roomImageRepository.findByRoomIn(rooms);
        Map<UUID, List<RoomImage>> imagesByRoomId = allImages.stream()
                .collect(Collectors.groupingBy(img -> img.getRoom().getRoomId()));

        return rooms.stream()
                .sorted(Comparator.comparing(Room::getRoomName, Comparator.nullsLast(String::compareToIgnoreCase)))
                .map(r -> {
                    String coverUrl = pickCoverUrl(imagesByRoomId.get(r.getRoomId()));
                    return RoomCardResponse.builder()
                            .roomId(r.getRoomId())
                            .rentalAreaId(r.getRentalArea().getRentalAreaId())
                            .roomName(r.getRoomName())
                            .roomStatus(r.getRoomStatus() != null ? r.getRoomStatus().name() : null)
                            .coverImageUrl(coverUrl)
                            .price(r.getPrice())
                            .capacity(r.getCapacity())
                            .build();
                })
                .toList();
    }


    @Override
    public RoomResponse getRoomDetail(UUID roomId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new NoSuchElementException("Room not found"));

        if (room.getRoomStatus() == RoomStatus.INACTIVE) {
            throw new NoSuchElementException("Room not found");
        }

        return mapToResponse(room);
    }

    @Override
    @Transactional
    public RoomResponse updateRoom(UUID roomId, UpdateRoomRequest req, List<MultipartFile> images, UUID currentUserId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new NoSuchElementException("Room not found"));

        if (room.getRoomStatus() == RoomStatus.INACTIVE) {
            throw new NoSuchElementException("Room not found");
        }

        UUID ownerId = room.getRentalArea().getOwner().getUserId();
        if (ownerId == null || !ownerId.equals(currentUserId)) {
            throw new RuntimeException("Forbidden: not owner of this room");
        }

        if (req.getRoomName() != null) room.setRoomName(req.getRoomName());
        if (req.getDescription() != null) room.setDescription(req.getDescription());
        if (req.getPrice() != null) room.setPrice(req.getPrice());
        if (req.getCapacity() != null) room.setCapacity(req.getCapacity());
        if (req.getArea() != null) room.setArea(req.getArea());

        if (req.getCategoryId() != null) {
            Category category = categoryRepository.findById(req.getCategoryId())
                    .orElseThrow(() -> new NoSuchElementException("Category not found"));
            room.setCategory(category);
        }

        if (req.getAmenityIds() != null) {
            if (req.getAmenityIds().isEmpty()) {
                room.setAmenities(new HashSet<>());
            } else {
                List<Amenity> found = amenityRepository.findAllById(req.getAmenityIds());
                if (found.size() != req.getAmenityIds().size()) {
                    throw new IllegalArgumentException("Some amenities not found");
                }
                room.setAmenities(new HashSet<>(found));
            }
        }

        boolean hasNewImages = images != null && images.stream().anyMatch(f -> f != null && !f.isEmpty());
        boolean replaceImages = Boolean.TRUE.equals(req.getReplaceImages())
                || (req.getReplaceImages() == null && hasNewImages);

        if (replaceImages) {
            int count = hasNewImages ? (int) images.stream().filter(f -> f != null && !f.isEmpty()).count() : 0;
            if (count < 1 || count > 5) {
                throw new IllegalArgumentException("Room requires 1 to 5 images when replacing images");
            }

            List<RoomImage> oldImages = roomImageRepository.findByRoom(room);
            for (RoomImage img : oldImages) {
                // nếu CloudinaryService bạn không có method này thì đổi theo tên hiện có
                cloudinaryService.deleteByPublicId(img.getPublicId());
            }
            roomImageRepository.deleteAll(oldImages);

            String folder = "rentals/" + room.getRentalArea().getRentalAreaId() + "/rooms/" + room.getRoomId();
            List<CloudinaryUploadResult> uploaded = cloudinaryService.uploadImages(images, folder);

            List<RoomImage> newEntities = new ArrayList<>();
            for (int i = 0; i < uploaded.size(); i++) {
                CloudinaryUploadResult u = uploaded.get(i);
                newEntities.add(RoomImage.builder()
                        .room(room)
                        .imageUrl(u.getUrl())
                        .publicId(u.getPublicId())
                        .isCover(i == 0)
                        .sortOrder(i)
                        .build());
            }
            roomImageRepository.saveAll(newEntities);
        }

        roomRepository.save(room);
        return mapToResponse(room);
    }


    @Override
    @Transactional
    public RoomResponse updateRoomStatus(UUID roomId, String status, UUID currentUserId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new NoSuchElementException("Room not found"));

        if (room.getRoomStatus() == RoomStatus.INACTIVE) {
            throw new NoSuchElementException("Room not found");
        }

        UUID ownerId = room.getRentalArea().getOwner().getUserId();
        if (ownerId == null || !ownerId.equals(currentUserId)) {
            throw new RuntimeException("Forbidden: not owner of this room");
        }

        RoomStatus newStatus;
        try {
            newStatus = RoomStatus.valueOf(status);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid room status: " + status);
        }

        room.setRoomStatus(newStatus);
        roomRepository.save(room);

        return mapToResponse(room);
    }

    @Override
    @Transactional
    public void deleteRoom(UUID roomId, UUID currentUserId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new NoSuchElementException("Room not found"));

        UUID ownerId = room.getRentalArea().getOwner().getUserId();
        if (ownerId == null || !ownerId.equals(currentUserId)) {
            throw new RuntimeException("Forbidden: not owner of this room");
        }

        List<RoomImage> oldImages = roomImageRepository.findByRoom(room);
        for (RoomImage img : oldImages) {
            cloudinaryService.deleteByPublicId(img.getPublicId());
        }
        roomImageRepository.deleteAll(oldImages);

        room.setRoomStatus(RoomStatus.INACTIVE);
        roomRepository.save(room);
    }

    // =========================
    // Mapper / helpers
    // =========================
    private RoomResponse mapToResponse(Room room) {
        List<RoomImageResponse> imageResponses = roomImageRepository.findByRoom(room)
                .stream()
                .sorted(Comparator.comparing(RoomImage::getSortOrder, Comparator.nullsLast(Integer::compareTo)))
                .map(this::mapRoomImage)
                .collect(Collectors.toList());

        Set<RoomResponse.AmenityItem> amenityItems =
                (room.getAmenities() == null ? Set.<Amenity>of() : room.getAmenities())
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

    private RoomImageResponse mapRoomImage(RoomImage img) {
        return RoomImageResponse.builder()
                .roomImageId(img.getRoomImageId())
                .imageUrl(img.getImageUrl())
                .isCover(img.getIsCover())
                .sortOrder(img.getSortOrder())
                .build();
    }

    private String pickCoverUrl(List<RoomImage> images) {
        if (images == null || images.isEmpty()) return null;

        Optional<RoomImage> cover = images.stream()
                .filter(i -> Boolean.TRUE.equals(i.getIsCover()))
                .findFirst();

        if (cover.isPresent()) return cover.get().getImageUrl();

        return images.stream()
                .min(Comparator.comparing(RoomImage::getSortOrder, Comparator.nullsLast(Integer::compareTo)))
                .map(RoomImage::getImageUrl)
                .orElse(null);
    }
}
