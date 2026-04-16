package org.rent.room.be.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.rent.room.be.dto.response.review.ReviewResponse;
import org.rent.room.be.entity.Review;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ReviewMapper {

    @Mapping(target = "id", source = "reviewId")
    @Mapping(target = "classId", source = "classRoom.classId")
    @Mapping(target = "className", source = "classRoom.className")
    @Mapping(target = "userName", source = "author.userName")
    @Mapping(target = "userAvatar", source = "author.userName") // changed: map to userName as a safe fallback because User has no avatar field
    @Mapping(target = "createdAt", source = "createdAt")
    ReviewResponse toResponse(Review review);

    List<ReviewResponse> toResponseList(List<Review> reviews);
}
