package org.rent.room.be.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.constant.Role;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserResponse {
    UUID userId;
    String userName;
    String email;
    String gender;
    String phone;
    LocalDate dateOfBirth;
    int age;
    Role role;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
    boolean active;
}
