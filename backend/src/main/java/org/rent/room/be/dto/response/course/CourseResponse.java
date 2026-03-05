package org.rent.room.be.dto.response.course;

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
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class CourseResponse {

    UUID courseId;
    UUID classId;
    String title;
    String description;
    Integer orderIndex;
    List<String> fileUrls;

    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}

