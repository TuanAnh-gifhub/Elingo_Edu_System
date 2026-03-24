package org.rent.room.be.dto.request.submission;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SubmissionAnswerRequest {

    @NotNull(message = "QUESTION_ID_REQUIRED")
    UUID questionId;

    String answerText;

    Integer selectedOptionIndex;

    UUID audioFileId;
}

