package org.rent.room.be.dto.response.post;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.dto.response.comment.CommentResponse;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class PostResponse {

    UUID postId;
    UUID authorId;
    String authorName;
    String content;
    List<String> images;
    List<String> videos;
    Integer likeCount;
    Integer commentCount;
    Boolean active;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;

    // Thêm danh sách comments
    List<CommentResponse> comments;
    Boolean isLiked;
}
