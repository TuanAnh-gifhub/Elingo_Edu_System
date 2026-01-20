package org.rent.room.be.dto.response;

import lombok.*;
import org.rent.room.be.constant.Role;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {
    private UUID userId;
    private String userName;
    private String fullName;
    private String email;
    private String gender;
    private String phone;
    private LocalDate dateOfBirth;
    private int age;
    private Role role;
    private LocalDateTime createdAt;
    private boolean isActive;
}
