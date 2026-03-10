package org.rent.room.be.dto.request.user;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.*; // Import bộ validation
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateUsersRequest {

    @NotBlank(message = "USERNAME_REQUIRED")
    @Size(min = 3, max = 50, message = "USERNAME_INVALID_SIZE")
    @Pattern(regexp = "^[a-zA-Z0-9._]+$", message = "USERNAME_INVALID_CHARACTERS")
    String userName;

    @Pattern(regexp = "^(MALE|FEMALE|OTHER)$", message = "GENDER_INVALID")
    String gender;

    @NotBlank(message = "EMAIL_REQUIRED")
    @Email(message = "EMAIL_INVALID_FORMAT")
    String email;

    @NotBlank(message = "PASSWORD_REQUIRED")
    @Size(min = 8, message = "PASSWORD_MIN_LENGTH")
    String password;

    @Pattern(regexp = "^0\\d{9}$", message = "PHONE_INVALID_FORMAT")
    String phone;

    @NotNull(message = "DOB_REQUIRED")
    @Past(message = "DOB_MUST_BE_IN_PAST")
    LocalDate dateOfBirth;

    @NotNull(message = "ROLE_REQUIRED")
    String roleName;

    String otp;
}