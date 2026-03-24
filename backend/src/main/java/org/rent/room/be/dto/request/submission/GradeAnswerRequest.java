package org.rent.room.be.dto.request.submission;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class GradeAnswerRequest {

    @NotNull(message = "ANSWER_ID_REQUIRED")
    UUID answerId;

    @NotNull(message = "ANSWER_SCORE_REQUIRED")
    @DecimalMin(value = "0.0", message = "ANSWER_SCORE_INVALID")
    BigDecimal score;

    String feedback;
}

