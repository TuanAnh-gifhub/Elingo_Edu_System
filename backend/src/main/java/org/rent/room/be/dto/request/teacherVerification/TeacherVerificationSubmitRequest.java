package org.rent.room.be.dto.request.teacherVerification;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TeacherVerificationSubmitRequest {

    @NotBlank(message = "FULL_NAME_REQUIRED")
    @Size(max = 120, message = "FULL_NAME_TOO_LONG")
    String fullName;

    @Pattern(regexp = "^0\\d{9,10}$", message = "PHONE_INVALID_FORMAT")
    String phone;

    @NotBlank(message = "BIO_REQUIRED")
    @Size(max = 500, message = "BIO_TOO_LONG")
    String bio;

    @NotBlank(message = "EXPERTISE_REQUIRED")
    @Size(max = 500, message = "EXPERTISE_TOO_LONG")
    String expertise;

    @NotBlank(message = "EXPERIENCE_REQUIRED")
    @Size(max = 1000, message = "EXPERIENCE_TOO_LONG")
    String experience;

    @NotEmpty(message = "CERTIFICATE_REQUIRED")
    List<String> certificateFiles;

    @Size(max = 500, message = "PORTFOLIO_LINK_TOO_LONG")
    String portfolioLink;
}

