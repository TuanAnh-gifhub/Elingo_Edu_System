package org.rent.room.be.dto.request.post;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class UpdatePostRequest {

    String content;
    List<String> images;
    List<String> videos;
}
