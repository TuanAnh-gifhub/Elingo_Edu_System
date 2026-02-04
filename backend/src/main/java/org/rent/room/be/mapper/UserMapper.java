package org.rent.room.be.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.rent.room.be.dto.response.UserResponse;
import org.rent.room.be.entity.User;

import java.time.LocalDate;
import java.time.Period;
import java.util.List;

@Mapper(componentModel = "spring")
public interface UserMapper {
    @Mapping(target = "userId", source = "userId")
    @Mapping(source = "role", target = "role", qualifiedByName = "mapRoleName")
    @Mapping(source = "dateOfBirth", target = "age", qualifiedByName = "calculateAge")
    UserResponse toUserResponse(User user);

    List<UserResponse> toUserResponseList(List<User> users);

    @Named("mapRoleName")
    default String mapRoleName(org.rent.room.be.entity.Role role) {
        return role != null ? role.getRoleName() : null;
    }

    @Named("calculateAge")
    default int calculateAge(LocalDate dateOfBirth) {
        if (dateOfBirth == null) {
            return 0;
        }
        return Period.between(dateOfBirth, LocalDate.now()).getYears();
    }
}