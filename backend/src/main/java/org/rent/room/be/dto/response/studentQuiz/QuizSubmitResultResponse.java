package org.rent.room.be.dto.response.studentQuiz;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class QuizSubmitResultResponse {
    UUID quizAttemptId;
    UUID quizId;
    BigDecimal score;
    int correctCount;
    int totalQuestions;
    LocalDateTime submittedAt;
    List<QuizSubmitQuestionResultResponse> details;
}
