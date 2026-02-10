package org.rent.room.be.serviceImpl;

import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.constant.PostStatus;
import org.rent.room.be.dto.request.post.CreatePostRequest;
import org.rent.room.be.dto.response.post.PostDetailResponse;
import org.rent.room.be.dto.response.post.PostResponse;
import org.rent.room.be.dto.response.post.PostSummaryResponse;
import org.rent.room.be.dto.response.rental_area.RentalAreaImageResponse;
import org.rent.room.be.dto.response.rental_area.RentalAreaResponse;
import org.rent.room.be.dto.response.room.RoomImageResponse;
import org.rent.room.be.dto.response.room.RoomResponse;
import org.rent.room.be.entity.*;
import org.rent.room.be.repository.*;
import org.rent.room.be.service.PostService;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PostServiceImpl implements PostService {

    PostRepository postRepository;
    RoomRepository roomRepository;
    UserRepository userRepository;
    RoomImageRepository roomImageRepository;
    RentalAreaImageRepository rentalAreaImageRepository;

    @Override
    @Transactional
    public PostResponse createPost(CreatePostRequest request, UUID currentUserId) {

        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new NoSuchElementException("Room not found"));

        // check owner (owner là rentalArea.owner)
        UUID ownerId = room.getRentalArea().getOwner().getUserId();
        if (ownerId == null || !ownerId.equals(currentUserId)) {
            throw new RuntimeException("Forbidden: not owner of this room");
        }

        if (postRepository.existsByRoom_RoomId(room.getRoomId())) {
            throw new IllegalArgumentException("This room already has a post");
        }

        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new NoSuchElementException("User not found"));

        Post post = Post.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .postStatus(PostStatus.PENDING)
                .room(room)
                .user(user)
                .build();

        post = postRepository.save(post);

        return PostResponse.builder()
                .postId(post.getPostId())
                .roomId(room.getRoomId())
                .userId(user.getUserId())
                .title(post.getTitle())
                .content(post.getContent())
                .postStatus(post.getPostStatus() != null ? post.getPostStatus().name() : null)
                .build();
    }

    @Override
    public List<PostSummaryResponse> getAllPosts() {
        List<Post> posts = postRepository.findAllByPostStatus(PostStatus.PUBLISHED);

        return posts.stream()
                .map(this::mapToSummary)
                .toList();
    }

    @Override
    public PostDetailResponse getPostDetail(UUID postId) {
        Post post = postRepository
                .findByPostIdAndPostStatus(postId, PostStatus.PUBLISHED)
                .orElseThrow(() -> new NoSuchElementException("Post not found"));

        Room room = post.getRoom();
        RentalArea rentalArea = room != null ? room.getRentalArea() : null;

        RoomResponse roomResponse = room != null ? mapRoomToResponse(room) : null;
        RentalAreaResponse rentalAreaResponse = rentalArea != null ? mapRentalAreaToResponse(rentalArea) : null;

        return PostDetailResponse.builder()
                .postId(post.getPostId())
                .title(post.getTitle())
                .content(post.getContent())
                .postStatus(post.getPostStatus() != null ? post.getPostStatus().name() : null)
                .room(roomResponse)
                .rentalArea(rentalAreaResponse)
                .build();
    }

    private PostSummaryResponse mapToSummary(Post post) {
        Room room = post.getRoom();
        RentalArea rentalArea = room != null ? room.getRentalArea() : null;

        String roomCover = null;
        if (room != null) {
            roomCover = roomImageRepository.findByRoom(room).stream()
                    .filter(img -> Boolean.TRUE.equals(img.getIsCover()))
                    .findFirst()
                    .map(RoomImage::getImageUrl)
                    .orElse(null);
        }

        String rentalCover = null;
        if (rentalArea != null) {
            rentalCover = rentalAreaImageRepository.findByRentalArea(rentalArea).stream()
                    .filter(img -> Boolean.TRUE.equals(img.getIsCover()))
                    .findFirst()
                    .map(RentalAreaImage::getImageUrl)
                    .orElse(null);
        }

        return PostSummaryResponse.builder()
                .postId(post.getPostId())
                .title(post.getTitle())
                .postStatus(post.getPostStatus() != null ? post.getPostStatus().name() : null)
                .roomId(room != null ? room.getRoomId() : null)
                .roomName(room != null ? room.getRoomName() : null)
                .price(room != null ? room.getPrice() : null)
                .capacity(room != null ? room.getCapacity() : null)
                .area(room != null ? room.getArea() : null)
                .roomCoverImageUrl(roomCover)
                .rentalAreaId(rentalArea != null ? rentalArea.getRentalAreaId() : null)
                .rentalAreaName(rentalArea != null ? rentalArea.getRentalAreaName() : null)
                .address(rentalArea != null ? rentalArea.getAddress() : null)
                .rentalAreaCoverImageUrl(rentalCover)
                .build();
    }

    private RoomResponse mapRoomToResponse(Room room) {
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

    private RentalAreaResponse mapRentalAreaToResponse(RentalArea rentalArea) {
        List<RentalAreaImageResponse> images = rentalAreaImageRepository.findByRentalArea(rentalArea).stream()
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
                .status(rentalArea.getStatus() != null ? rentalArea.getStatus().name() : null)
                .images(images)
                .build();
    }
}

