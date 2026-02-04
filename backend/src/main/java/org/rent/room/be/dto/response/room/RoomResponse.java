package org.rent.room.be.dto.response.room;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RoomResponse {

    UUID roomId;
    UUID rentalAreaId;

    String roomName;
    String description;
    String roomStatus;

    Integer capacity;
    Double area;

    Integer categoryId;
    String categoryName;

    Set<AmenityItem> amenities;
    List<RoomImageResponse> images;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AmenityItem {
        Long amenityId;
        String amenityName;
    }
}
