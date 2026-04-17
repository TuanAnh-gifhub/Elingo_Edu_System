package org.rent.room.be.dto.response.questionOption;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class QuestionOptionResponse {
    UUID optionId;
    UUID questionId;
    String optionText;
    Boolean isCorrect;
    Integer orderIndex;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}

