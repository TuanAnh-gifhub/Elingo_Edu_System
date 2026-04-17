package org.rent.room.be.dto.response.quiz;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class QuizOpenStatusEventResponse {
    UUID classId;
    UUID courseId;
    UUID quizId;
    String title;
    Boolean isOpen;
    Integer maxAttempts;
    Integer durationMinutes;
}

