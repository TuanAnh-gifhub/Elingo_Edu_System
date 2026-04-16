package org.rent.room.be.service;

import org.rent.room.be.base.PageResponse;
import org.rent.room.be.dto.request.auth.ResetPasswordRequest;
import org.rent.room.be.dto.request.user.CreateUsersRequest;
import org.rent.room.be.dto.request.user.UpdateUserRequest;
import org.rent.room.be.dto.response.UserResponse;
import org.rent.room.be.dto.response.teacher.TeacherProfileResponse;
import org.rent.room.be.entity.User;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

public interface UserService {

    UserResponse createUser(CreateUsersRequest users);

    UserResponse getProfileUser();

    PageResponse<UserResponse> getAllUsers(int page, int size, String role, Boolean active, String keyword);

    User findByEmail(String name);

    User findByUserId(UUID id);

    void processForgotPassword(String email);

    void processResetPassword(ResetPasswordRequest request);

    void updateStatus(UUID id, Boolean active);

    UserResponse updateUser(UUID id, UpdateUserRequest request);

    List<TeacherProfileResponse> getTopTeachers(int limit);

    long countActiveTeachers();

    PageResponse<UserResponse> getTeachers(int page, int size, Boolean active, String keyword);

    void updateTeacherStatus(UUID teacherId, Boolean active);

    @Transactional(readOnly = true)
    User getCurrentUserEntity();
}
