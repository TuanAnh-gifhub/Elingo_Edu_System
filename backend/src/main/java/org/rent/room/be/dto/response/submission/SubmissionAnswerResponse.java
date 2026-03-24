package org.rent.room.be.dto.response.submission;

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
public class SubmissionAnswerResponse {

    UUID answerId;
    UUID questionId;
    Integer questionOrder;
    AssignmentQuestionType questionType;
    String questionContent;
    String answerText;
    Integer selectedOptionIndex;
    List<Integer> selectedOptionIndexes;
    String audioUrl;
    String transcriptText;
    BigDecimal score;
    String feedback;
    boolean autoGraded;
}

