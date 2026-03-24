package org.rent.room.be.dto.request.assignment;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
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
public class CreateAssignmentRequest {

    @NotNull(message = "CLASS_ID_REQUIRED")
    UUID classId;

    @NotBlank(message = "ASSIGNMENT_TITLE_REQUIRED")
    String title;

    String description;

    LocalDateTime deadline;

    String accessPassword;

    Integer maxAttempts;

    Integer timeLimitMinutes;

    @Valid
    @NotEmpty(message = "ASSIGNMENT_QUESTIONS_REQUIRED")
    List<AssignmentQuestionRequest> questions;
}

