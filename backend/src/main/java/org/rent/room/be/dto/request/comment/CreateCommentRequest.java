package org.rent.room.be.dto.request.comment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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
public class CreateCommentRequest {

    @NotNull
    UUID postId;

    UUID parentCommentId;

    @NotBlank
    @Size(min = 1, max = 2000)
    String content;

    List<String> images;

    List<String> videos;
}

