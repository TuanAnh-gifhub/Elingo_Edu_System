package org.rent.room.be.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.base.ApiResponse;
import org.rent.room.be.base.PageResponse;
import org.rent.room.be.dto.request.auth.ResetPasswordRequest;
import org.rent.room.be.dto.request.user.CreateUsersRequest;
import org.rent.room.be.dto.request.user.UpdateUserRequest;
import org.rent.room.be.dto.request.user.UpdateUserStatusRequest;
import org.rent.room.be.dto.response.UserResponse;
import org.rent.room.be.service.EmailService;
import org.rent.room.be.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RequiredArgsConstructor
@RestController
@FieldDefaults(level = AccessLevel.PACKAGE, makeFinal = true)
@RequestMapping("/users")
@Tag(name = "2. User", description = "API quản lý người dùng")
public class UserController {

    UserService userService;
    EmailService emailService;

    @PostMapping("/create")
    public ResponseEntity<ApiResponse<?>> createUser(@RequestBody CreateUsersRequest user) {
        UserResponse users = userService.createUser(user);
        return ResponseEntity.ok(
                ApiResponse.<UserResponse>builder()
                        .code(200)
                        .message("Create user successfully")
                        .result(users)
                        .build()
        );
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<?>> getProfileUser() {
        return ResponseEntity.ok(
                ApiResponse.<UserResponse>builder()
                        .code(200)
                        .message("Get my info successfully")
                        .result(userService.getProfileUser())
                        .build()
        );
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PageResponse<UserResponse>>> getAllUsers(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String keyword
    ) {
        return ResponseEntity.ok(
                ApiResponse.<PageResponse<UserResponse>>builder()
                        .code(200)
                        .message("Get users success")
                        .result(userService.getAllUsers(page - 1, size, role, active, keyword))
                        .build()
        );
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<?>> forgotPassword(@RequestParam String email) {
        userService.processForgotPassword(email);
        return ResponseEntity.ok(
                ApiResponse.builder()
                        .code(200)
                        .message("Vui lòng kiểm tra email để lấy lại mật khẩu.")
                        .build()
        );
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<?>> resetPassword(@RequestBody ResetPasswordRequest request) {
        userService.processResetPassword(request);
        return ResponseEntity.ok(
                ApiResponse.builder()
                        .code(200)
                        .message("Đổi mật khẩu thành công.")
                        .build()
        );
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> updateStatus(
            @PathVariable UUID id,
            @RequestBody UpdateUserStatusRequest statusRequest) {
        userService.updateStatus(id, statusRequest.getStatus());
        return ResponseEntity.ok(
                ApiResponse.builder()
                        .code(200)
                        .message("Update status user successfully")
                        .build()
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> updateUser(
            @PathVariable UUID id,
            @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(
                ApiResponse.<UserResponse>builder()
                        .code(200)
                        .message("Cập nhật thông tin thành công")
                        .result(userService.updateUser(id, request))
                        .build()
        );
    }

    @PostMapping("/register/request")
    public ResponseEntity<ApiResponse<?>> sendOtp(
            @RequestBody CreateUsersRequest user
    ) {
        emailService.sendOtpRegister(user);

        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .code(200)
                        .message("Mã xác thực đã được gửi tới email của bạn.")
                        .build()
        );
    }

    @PostMapping("/register/confirm")
    public ResponseEntity<ApiResponse<?>> confirmRegister(
            @RequestParam String email,
            @RequestParam String otp) {

        CreateUsersRequest userRequest = emailService.verifyAndGetPendingUser(email, otp);

        userService.createUser(userRequest);

        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .code(200)
                        .message("Đăng ký tài khoản thành công!")
                        .build()
        );
    }
}
