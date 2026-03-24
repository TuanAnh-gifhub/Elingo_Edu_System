package org.rent.room.be.dto.request.submission;

import jakarta.validation.Valid;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class GradeSubmissionRequest {

    String teacherFeedback;

    @Valid
    List<GradeAnswerRequest> answers;
}

