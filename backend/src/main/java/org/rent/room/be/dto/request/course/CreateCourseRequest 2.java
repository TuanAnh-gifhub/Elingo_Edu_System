package org.rent.room.be.dto.request.course;

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
public class CreateCourseRequest {

    UUID classId;
    String title;
    String description;
    Integer orderIndex;
    List<String> fileUrls;
}

