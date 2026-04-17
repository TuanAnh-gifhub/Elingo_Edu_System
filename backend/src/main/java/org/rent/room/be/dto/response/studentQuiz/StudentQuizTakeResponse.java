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
public class StudentQuizTakeResponse {
    UUID quizId;
    UUID courseId;
    String title;
    String description;
    /** Số lần tối đa được phép làm. */
    Integer maxAttempts;
    /** Thời gian làm bài (phút). */
    Integer durationMinutes;
    /** Số lần đã nộp bài. */
    Integer attemptsUsed;
    /** Số lần còn lại (0 = không được làm thêm). */
    Integer attemptsRemaining;
    List<StudentQuizQuestionResponse> questions;
}
