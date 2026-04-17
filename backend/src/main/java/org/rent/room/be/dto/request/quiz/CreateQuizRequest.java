package org.rent.room.be.dto.request.quiz;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateQuizRequest {
    UUID courseId;
    String title;
    String description;
    /** Số lần được làm bài; mặc định 1 nếu không gửi. Tối thiểu 1. */
    Integer maxAttempts;
    /** Thời gian làm bài (phút); mặc định 30 nếu không gửi. */
    Integer durationMinutes;
}
