package org.rent.room.be.dto.response.question;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.constant.QuestionType;
import org.rent.room.be.dto.response.questionOption.QuestionOptionResponse;

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
public class QuestionResponse {
    UUID questionId;
    UUID quizId;
    String questionText;
    QuestionType questionType;
    Integer orderIndex;
    List<QuestionOptionResponse> options;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}

