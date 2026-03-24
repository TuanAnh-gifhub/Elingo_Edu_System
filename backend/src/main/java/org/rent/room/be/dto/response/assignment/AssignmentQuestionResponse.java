package org.rent.room.be.dto.response.assignment;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.constant.AssignmentQuestionType;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AssignmentQuestionResponse {

    UUID questionId;
    Integer questionOrder;
    AssignmentQuestionType questionType;
    String questionContent;
    List<String> options;
    Integer correctOptionIndex;
    List<Integer> correctOptionIndexes;
    String sampleAnswer;
    BigDecimal maxScore;
}

