package org.rent.room.be.dto.request.questionOption;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateQuestionOptionRequest {
    String optionText;
    Boolean isCorrect;
    Integer orderIndex;
}

