package org.rent.room.be.dto.response.post;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PostResponse {

    UUID postId;
    UUID roomId;
    UUID userId;

    String title;
    String content;
    String postStatus;
}
