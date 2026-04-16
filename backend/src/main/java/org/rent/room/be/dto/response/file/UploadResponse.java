package org.rent.room.be.dto.response.file;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class UploadResponse {
    String url;
    String originalFilename;
    String resourceType;
    String publicId;
    String format;
    Integer width;
    Integer height;
    Long bytes;
    Double duration;
}