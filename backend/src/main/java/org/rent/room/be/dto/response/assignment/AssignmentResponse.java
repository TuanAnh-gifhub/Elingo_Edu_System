package org.rent.room.be.dto.response.assignment;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AssignmentResponse {

    UUID assignmentId;
    UUID classId;
    UUID teacherId;
    String teacherName;
    String title;
    String description;
    LocalDateTime deadline;
    boolean passwordRequired;
    Integer maxAttempts;
    Integer timeLimitMinutes;
    boolean active;
    List<AssignmentQuestionResponse> questions;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}

