package org.rent.room.be.dto.request.question;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.constant.QuestionType;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateQuestionRequest {
    UUID quizId;
    String questionText;
    QuestionType questionType;
    Integer orderIndex;
}

