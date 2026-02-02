package org.rent.room.be.serviceImpl;

import lombok.RequiredArgsConstructor;
import org.rent.room.be.base.PageResponse;
import org.rent.room.be.constant.AuthProvider;
import org.rent.room.be.dto.request.auth.ResetPasswordRequest;
import org.rent.room.be.dto.request.user.CreateUsersRequest;
import org.rent.room.be.dto.request.user.UpdateUserRequest;
import org.rent.room.be.dto.response.UserResponse;
import org.rent.room.be.entity.PasswordResetToken;
import org.rent.room.be.entity.Role;
import org.rent.room.be.entity.User;
import org.rent.room.be.exception.AppException;
import org.rent.room.be.exception.ErrorCode;
import org.rent.room.be.mapper.UserMapper;
import org.rent.room.be.repository.RoleRepository;
import org.rent.room.be.repository.UserRepository;
import org.rent.room.be.repository.mongo.PasswordResetTokenRepository;
import org.rent.room.be.service.EmailService;
import org.rent.room.be.service.UserService;
import org.rent.room.be.specification.UserSpecification;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailService emailService;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Value("${token_reset_password_expire_seconds}")
    private long EXPIRATION_SEC;

    @Override
    @Transactional
    public UserResponse createUser(CreateUsersRequest createUser) {
        if (userRepository.existsByEmail(createUser.getEmail())) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        Role role = roleRepository.findByRoleName(createUser.getRoleName())
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));

        User user = User.builder()
                .userName(createUser.getUserName())
                .email(createUser.getEmail())
                .gender(createUser.getGender())
                .passwordHash(passwordEncoder.encode(createUser.getPassword()))
                .phone(createUser.getPhone())
                .dateOfBirth(createUser.getDateOfBirth())
                .role(role)
                .active(true)
                .provider(AuthProvider.LOCAL)
                .build();

        return userMapper.toUserResponse(userRepository.save(user));
    }

    @Override
    @Transactional
    public UserResponse getProfileUser() {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AppException(ErrorCode.USER_NOT_AUTHENTICATED);
        }
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        return userMapper.toUserResponse(user);
    }

    @Override
    public PageResponse<UserResponse> getAllUsers(int page, int size, String role, Boolean active, String keyword) {

        Sort sort = Sort.by("createdAt").descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Specification<User> spec = UserSpecification.filterUsers(keyword, role, active);

        Page<User> pageData = userRepository.findAll(spec, pageable);

        Page<UserResponse> responsePage = pageData.map(userMapper::toUserResponse);

        return PageResponse.<UserResponse>builder()
                .currentPage(page + 1)
                .totalPages(pageData.getTotalPages())
                .pageSize(pageData.getSize())
                .totalElements(pageData.getTotalElements())
                .data(responsePage.getContent())
                .build();
    }

    @Override
    public User findByEmail(String email) {
        return userRepository.findByEmail(email).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    @Override
    public User findByUserId(UUID id) {
        return userRepository.findByUserId(id);
    }

    @Override
    public void processForgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.EMAIL_NOT_FOUND));
        String token = createTokenResetPassword(email);
        String resetLink = "http://localhost:5173/reset-password?token=" + token;
        emailService.sendResetPasswordEmail(user.getEmail(), resetLink);
    }

    @Transactional
    @Override
    public void processResetPassword(ResetPasswordRequest request) {
        // 1. Validate token bên Mongo -> Lấy ra email
        String email = validateTokenResetPassword(request.getToken());

        // 2. Tìm user
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        // 3. Mã hóa và cập nhật mật khẩu mới
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // 4. Xóa token để không dùng lại được nữa
        deleteTokenResetPassword(request.getToken());
    }

    @Override
    public void updateStatus(UUID id, Boolean active) {
        User user = userRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        user.setActive(active);
        userRepository.save(user);
    }

    @Override
    public UserResponse updateUser(UUID id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (request.getUserName() != null) {
            user.setUserName(request.getUserName());
        }

        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }

        if (request.getGender() != null) {
            user.setGender(request.getGender());
        }

        if (request.getDateOfBirth() != null) {
            user.setDateOfBirth(request.getDateOfBirth());
        }

        User savedUser = userRepository.save(user);

        return userMapper.toUserResponse(savedUser);
    }


    private String createTokenResetPassword(String email) {
        passwordResetTokenRepository.deleteByEmail(email);

        String tokenString = UUID.randomUUID().toString();

        // 3. Tính thời gian hết hạn
        Instant expiryDate = Instant.now().plusSeconds(EXPIRATION_SEC);

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .email(email)
                .token(tokenString)
                .expiryDate(expiryDate)
                .build();

        passwordResetTokenRepository.save(resetToken);

        return tokenString;
    }

    private String validateTokenResetPassword(String token) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Token không hợp lệ hoặc không tồn tại"));

        // Kiểm tra hết hạn thủ công (đề phòng MongoDB chưa kịp xóa background)
        if (resetToken.getExpiryDate().isBefore(Instant.now())) {
            passwordResetTokenRepository.delete(resetToken);
            throw new RuntimeException("Token đã hết hạn");
        }

        return resetToken.getEmail();
    }

    private void deleteTokenResetPassword(String token) {
        passwordResetTokenRepository.findByToken(token)
                .ifPresent(passwordResetTokenRepository::delete);
    }
}
