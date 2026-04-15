package org.rent.room.be.dto.request.teacherVerification;

import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.constant.TeacherVerificationStatus;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TeacherVerificationReviewRequest {

    @NotNull(message = "STATUS_REQUIRED")
    TeacherVerificationStatus status;

    String adminNote;
}

