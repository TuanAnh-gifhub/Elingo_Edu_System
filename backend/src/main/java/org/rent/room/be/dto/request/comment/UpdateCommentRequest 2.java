package org.rent.room.be.dto.request.comment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class UpdateCommentRequest {

    @NotBlank
    @Size(min = 1, max = 2000)
    String content;

    List<String> images;

    List<String> videos;
}

