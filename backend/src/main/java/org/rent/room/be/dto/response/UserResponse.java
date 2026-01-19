package org.rent.room.be.dto.response;

import lombok.*;
import org.rent.room.be.entity.Role;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {
    private UUID userId;
    private String username;
    private String email;
    private String phoneNumber;
    private String fullName;
    private String gender;
    private int age;
    private String address;
    private Date dateOfBirth;
    private String password;
    private Role role;
    private LocalDateTime createdAt;
    private boolean isLocked;
}
