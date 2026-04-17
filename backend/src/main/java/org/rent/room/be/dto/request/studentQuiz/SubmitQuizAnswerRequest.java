package org.rent.room.be.dto.request.studentQuiz;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SubmitQuizAnswerRequest {
    UUID questionId;
    List<UUID> selectedOptionIds;
}
