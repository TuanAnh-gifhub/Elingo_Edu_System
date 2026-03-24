package org.rent.room.be.dto.response.submission;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.constant.SubmissionStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SubmissionResponse {

    UUID submissionId;
    UUID assignmentId;
    UUID studentId;
    String studentName;
    Integer attemptNumber;
    LocalDateTime attemptStartedAt;
    LocalDateTime submittedAt;
    SubmissionStatus status;
    BigDecimal totalScore;
    String teacherFeedback;
    Boolean autoSubmitted;
    List<SubmissionAnswerResponse> answers;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}

