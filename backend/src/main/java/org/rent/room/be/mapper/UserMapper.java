package org.rent.room.be.mapper;


import org.rent.room.be.dto.response.UserResponse;
import org.rent.room.be.entity.User;
import org.springframework.stereotype.Component;

import java.sql.Date;
import java.time.LocalDate;
import java.time.Period;

@Component
public class UserMapper {


    public UserResponse toUserResponse(User user) {
        if (user == null) return null;



        return UserResponse.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .phoneNumber(user.getPhone())
                .fullName(user.getFullName())
                .gender(user.getGender() != null  ? user.getGender() : "khác")
                .age(calculateAge(user.getDateOfBirth()))
//                .dateOfBirth(user.getDateOfBirth() != null ? user.getDateOfBirth().withDayOfMonth() : null)
//                .role(user.getRole() != null ? user.getRole().getName() : null)
                .createdAt(user.getCreated_at())
                .build();
    }

    private int calculateAge(LocalDate dob) {
        if (dob == null) return 0;
        return Period.between(dob, LocalDate.now()).getYears();
    }
}
