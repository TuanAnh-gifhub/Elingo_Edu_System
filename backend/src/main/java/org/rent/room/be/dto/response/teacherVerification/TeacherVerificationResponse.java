package org.rent.room.be.dto.response.teacherVerification;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.constant.TeacherVerificationStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TeacherVerificationResponse {
    UUID id;
    UUID userId;
    String role;
    String fullName;
    String email;
    String phone;
    String bio;
    String expertise;
    String experience;
    List<String> certificateFiles;
    String portfolioLink;
    TeacherVerificationStatus status;
    String adminNote;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}

