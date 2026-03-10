package org.rent.room.be.dto.request.course;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class UpdateCourseRequest {

    String title;
    String description;
    Integer orderIndex;
    List<String> fileUrls;
}

