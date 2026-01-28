package org.rent.room.be.service;

import org.rent.room.be.base.PageResponse;
import org.rent.room.be.dto.request.auth.ResetPasswordRequest;
import org.rent.room.be.dto.request.user.CreateUsersRequest;
import org.rent.room.be.dto.response.UserResponse;
import org.rent.room.be.entity.User;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

public interface UserService {

    UserResponse createUser(CreateUsersRequest users);

    UserResponse getProfileUser();

    PageResponse<UserResponse> getAllUsers(int page, int size, String role, Boolean active);

    List<UserResponse> getAllUsersByName(String username);

    User findByEmail(String name);

    User findByUserId(UUID id);

    void processForgotPassword(String email);

    void processResetPassword(ResetPasswordRequest request);
}
