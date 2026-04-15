package org.rent.room.be.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.entity.Role;
import org.rent.room.be.entity.User;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
@JsonInclude(JsonInclude.Include.NON_NULL)
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
    String role;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
    boolean active;
    Boolean emailVerified;

    public static  UserResponse fromEntityReport(User user) {
       if(user == null){
           return null;
       }
       return UserResponse.builder()
               .email(user.getEmail())
               .phone(user.getPhone())
               .build();
    }
}
