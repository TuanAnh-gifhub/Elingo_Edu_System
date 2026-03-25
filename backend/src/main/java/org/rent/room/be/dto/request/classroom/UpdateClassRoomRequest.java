package org.rent.room.be.dto.request.classroom;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class UpdateClassRoomRequest {

    String className;
    String description;
    UUID teacherId;
    BigDecimal price;
    LocalDateTime startDate;
    LocalDateTime endDate;
    Integer maxStudents;
    String schedule;
    String joinCode;
    Boolean joinCodeRequired;
    Boolean active;
}

