package org.rent.room.be.service;

import org.rent.room.be.dto.request.user.CreateUsersRequest;
import org.rent.room.be.dto.response.UserResponse;
import org.rent.room.be.entity.User;

import java.util.List;
import java.util.UUID;

public interface UserService {

    UserResponse createUser(CreateUsersRequest users);

    UserResponse getMe();

    List<UserResponse> getAllUsers();

    List<UserResponse> getAllUsersByName(String username);

    User findByEmail(String name);

    User findByUserId(UUID id);
}
