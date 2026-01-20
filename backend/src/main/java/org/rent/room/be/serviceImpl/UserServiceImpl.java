package org.rent.room.be.serviceImpl;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.constant.Role;
import org.rent.room.be.dto.request.user.CreateUsersRequest;
import org.rent.room.be.dto.response.UserResponse;
import org.rent.room.be.entity.User;
import org.rent.room.be.exception.AppException;
import org.rent.room.be.exception.ErrorCode;
import org.rent.room.be.mapper.UserMapper;
import org.rent.room.be.repository.UserRepository;
import org.rent.room.be.service.UserService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserServiceImpl implements UserService {

    UserRepository userRepository;

    UserMapper userMapper;

    PasswordEncoder passwordEncoder;

    @Transactional
    public UserResponse createUser(CreateUsersRequest createUser) {

        if (userRepository.existsByEmail(createUser.getEmail())) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        Role role = Role.MEMBER;
        if (createUser.getRole() != null) {
            role = Role.valueOf(createUser.getRole());
        }

        User user = User.builder()
                .userName(createUser.getUserName())
                .fullName(createUser.getFullName())
                .email(createUser.getEmail())
                .gender(createUser.getGender())
                .passwordHash(passwordEncoder.encode(createUser.getPassword()))
                .phone(createUser.getPhone())
                .dateOfBirth(createUser.getDateOfBirth())
                .role(role)
                .isActive(true)
                .build();

        return userMapper.toUserResponse(userRepository.save(user));
    }

    @Override
    @Transactional
    public UserResponse getMe() {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AppException(ErrorCode.USER_NOT_AUTHENTICATED);
        }

        User users = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        return userMapper.toUserResponse(users);
    }

    @Override
    public List<UserResponse> getAllUsers() {
        return userMapper.toUserResponseList(userRepository.findAll());
    }

    @Override
    public List<UserResponse> getAllUsersByName(String username) {
        return userMapper.toUserResponseList(userRepository.findByUserName(username));
    }

    @Override
    public User findByEmail(String email) {
        return userRepository.findByEmail(email).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    @Override
    public User findByUserId(UUID id) {
        return userRepository.findByUserId(id);
    }
}
