package org.rent.room.be.dto.request.post;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class CreatePostRequest {

    UUID userId;
    String content;
    List<String> images;
    List<String> videos;
}
