package org.rent.room.be.dto.request.teacherVerification;

import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TeacherVerificationRejectRequest {
    @Size(max = 1000, message = "ADMIN_NOTE_TOO_LONG")
    String adminNote;
}

