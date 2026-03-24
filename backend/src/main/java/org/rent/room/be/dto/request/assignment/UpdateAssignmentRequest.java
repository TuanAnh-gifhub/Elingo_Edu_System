package org.rent.room.be.dto.request.assignment;

import jakarta.validation.Valid;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateAssignmentRequest {

    String title;

    String description;

    LocalDateTime deadline;

    Boolean clearDeadline;

    String accessPassword;

    Integer maxAttempts;

    Integer timeLimitMinutes;

    Boolean clearTimeLimit;

    Boolean active;

    @Valid
    List<AssignmentQuestionRequest> questions;
}

