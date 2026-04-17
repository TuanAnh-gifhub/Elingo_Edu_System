package org.rent.room.be.dto.response.classroom;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class ClassRoomResponse {

    UUID classId;
    String className;
    String description;

    UUID teacherId;
    String teacherName;
    String teacherEmail;

    BigDecimal price;
    LocalDateTime startDate;
    LocalDateTime endDate;
    Integer maxStudents;
    Integer currentStudents;
    boolean active;
    String schedule;
    String poster;
    Boolean onlineOpen;

    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}

