package org.rent.room.be.dto.request.studentQuiz;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SubmitQuizRequest {
    List<SubmitQuizAnswerRequest> answers;
}
