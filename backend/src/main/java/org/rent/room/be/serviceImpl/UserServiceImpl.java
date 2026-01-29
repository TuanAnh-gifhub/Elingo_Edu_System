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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
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

        User user = User.builder()
                .userName(createUser.getUserName())
                .email(createUser.getEmail())
                .gender(createUser.getGender())
                .passwordHash(passwordEncoder.encode(createUser.getPassword()))
                .phone(createUser.getPhone())
                .dateOfBirth(createUser.getDateOfBirth())
                .role(Role.valueOf(createUser.getRole()))
                .active(true)
                .build();

        return userMapper.toUserResponse(userRepository.save(user));
    }

    @Override
    @Transactional
    public UserResponse getProfileUser() {

       Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
       if(authentication == null || !authentication.isAuthenticated()){
           throw new AppException(ErrorCode.USER_NOT_AUTHENTICATED);
       }
       User user = userRepository.findByEmail(authentication.getName())
               .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

       return userMapper.toUserResponse(user);
    }

    @Override
    public List<UserResponse> getAllUsers(int page,int size) {
        Pageable pageable  = PageRequest.of(page -1,size);
        Page<User> userList = userRepository.findAll(pageable);

        return userMapper.toUserResponseList(userList.getContent());
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
