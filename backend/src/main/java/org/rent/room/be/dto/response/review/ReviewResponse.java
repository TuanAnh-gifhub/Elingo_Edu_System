package org.rent.room.be.dto.response.review;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class ReviewResponse {
    UUID id;
    UUID authorId;
    UUID classId;
    String className;
    Integer rating;
    String comment;
    String userName;
    String userAvatar; // optional (User entity currently doesn't have avatar field; may be null)
    LocalDateTime createdAt;
}

