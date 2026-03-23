package org.rent.room.be.dto.response.studentQuiz;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class QuizSubmitQuestionResultResponse {
    UUID questionId;
    boolean correct;
    List<UUID> selectedOptionIds;
    List<UUID> correctOptionIds;
}
