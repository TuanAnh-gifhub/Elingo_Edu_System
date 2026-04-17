package org.rent.room.be.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.rent.room.be.base.ApiResponse;
import org.rent.room.be.dto.request.auth.LoginGoogleRequest;
import org.rent.room.be.dto.request.auth.LoginRequest;
import org.rent.room.be.dto.request.auth.ResetPasswordRequest;
import org.rent.room.be.dto.request.user.CreateUsersRequest;
import org.rent.room.be.dto.response.auth.LoginGoogleResponse;
import org.rent.room.be.dto.response.auth.LoginResponse;
import org.rent.room.be.service.AuthGoogleService;
import org.rent.room.be.service.AuthService;
import org.rent.room.be.service.EmailService;
import org.rent.room.be.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/auth")
@Tag(name = "1. Authentication")
public class AuthController {

    AuthService authService;
    AuthGoogleService authGoogleService;
    UserService userService;
    EmailService emailService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@RequestBody LoginRequest request, HttpServletResponse response) {
        LoginResponse loginResponse = authService.login(request);
        return ResponseEntity.ok(ApiResponse.<LoginResponse>builder()
                .code(200)
                .message("Login successfully")
                .result(loginResponse)
                .build());
    }

    @PostMapping("/google")
    public ResponseEntity<ApiResponse<LoginResponse>> loginGoogle(
            @RequestBody LoginGoogleRequest request
    ) {
        LoginGoogleResponse googleInfo = authGoogleService.authenticate(request.getCode());

        LoginResponse tokens = authService.loginWithGoogle(
                googleInfo.getEmail(),
                googleInfo.getName(),
                googleInfo.getId()
        );

        return ResponseEntity.ok(ApiResponse.<LoginResponse>builder()
                .code(200)
                .message("Google Login successfully")
                .result(tokens)
                .build());
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<LoginResponse>> refresh(
            HttpServletRequest request,
            HttpServletResponse response) {

        LoginResponse newTokens = authService.refresh(request);
        return ResponseEntity.ok(ApiResponse.<LoginResponse>builder()
                .code(200)
                .message("Refresh successfully")
                .result(newTokens)
                .build());
    }

    @PostMapping("/register/request")
    public ResponseEntity<ApiResponse<?>> sendOtp(
            @RequestBody CreateUsersRequest user
    ) {
        // Registration role is always STUDENT, clients cannot self-assign elevated roles.
        user.setRoleName("STUDENT");
        emailService.sendOtpRegister(user);

        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .code(200)
                        .message("Mã xác thực đã được gửi tới email của bạn.")
                        .build()
        );
    }

    @GetMapping("/register/confirm")
    public ResponseEntity<ApiResponse<?>> confirmRegister(
            @RequestParam String email,
            @RequestParam String otp) {

        CreateUsersRequest userRequest = emailService.verifyAndGetPendingUser(email, otp);

        userService.createUser(userRequest);
        emailService.deletePendingUser(email);

        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .code(200)
                        .message("Đăng ký tài khoản thành công!")
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
}
