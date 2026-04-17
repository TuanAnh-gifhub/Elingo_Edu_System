package org.rent.room.be.dto.response.quiz;

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
public class QuizResponse {
    UUID quizId;
    UUID courseId;
    String title;
    String description;
    Integer maxAttempts;
    Integer durationMinutes;
    Boolean isOpen;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
