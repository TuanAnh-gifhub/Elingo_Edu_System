package org.rent.room.be.dto.request.submission;

import jakarta.validation.Valid;
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
public class CreateSubmissionRequest {

    @NotNull(message = "ASSIGNMENT_ID_REQUIRED")
    UUID assignmentId;

    String accessPassword;

    LocalDateTime attemptStartedAt;

    Boolean autoSubmitted;

    @Valid
    @NotEmpty(message = "SUBMISSION_ANSWERS_REQUIRED")
    List<SubmissionAnswerRequest> answers;
}

