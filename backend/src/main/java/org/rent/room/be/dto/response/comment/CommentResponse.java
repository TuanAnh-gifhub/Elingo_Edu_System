package org.rent.room.be.dto.response.comment;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CommentResponse {
    UUID commentId;
    UUID authorId;
    String authorName;
    String content;
    List<String> images;
    List<String> videos;
    Integer likeCount;
    UUID parentCommentId; // Để hỗ trợ reply comment
    Boolean active;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
