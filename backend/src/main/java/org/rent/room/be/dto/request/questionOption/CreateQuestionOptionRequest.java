package org.rent.room.be.dto.request.questionOption;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateQuestionOptionRequest {
    UUID questionId;
    String optionText;
    Boolean isCorrect;
    Integer orderIndex;
}

