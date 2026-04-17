package org.rent.room.be.dto.response.enrollment;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.entity.Enrollment;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class StudentQuizScoreRowResponse {

    UUID enrollmentId;
    UUID studentId;
    String studentName;
    LocalDateTime enrollmentDate;
    Enrollment.PaymentStatus paymentStatus;
    Map<String, BigDecimal> quizScores;
}

