package org.rent.room.be.dto.request.assignment;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.constant.AssignmentQuestionType;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AssignmentQuestionRequest {

    @NotNull(message = "QUESTION_ORDER_REQUIRED")
    Integer questionOrder;

    @NotNull(message = "QUESTION_TYPE_REQUIRED")
    AssignmentQuestionType questionType;

    @NotBlank(message = "QUESTION_CONTENT_REQUIRED")
    String questionContent;

    List<String> options;

    Integer correctOptionIndex;

    List<Integer> correctOptionIndexes;

    String sampleAnswer;

    @NotNull(message = "QUESTION_MAX_SCORE_REQUIRED")
    @DecimalMin(value = "0.0", message = "QUESTION_MAX_SCORE_INVALID")
    BigDecimal maxScore;
}

