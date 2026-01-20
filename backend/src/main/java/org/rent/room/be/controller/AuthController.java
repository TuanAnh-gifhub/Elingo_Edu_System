package org.rent.room.be.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.base.ApiResponse;
import org.rent.room.be.dto.request.auth.LoginGoogleRequest;
import org.rent.room.be.dto.request.auth.LoginRequest;
import org.rent.room.be.dto.response.auth.LoginGoogleResponse;
import org.rent.room.be.dto.response.auth.LoginResponse;
import org.rent.room.be.properties.CookieProperties;
import org.rent.room.be.service.AuthGoogleService;
import org.rent.room.be.service.AuthService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/auth")
@Tag(name = "1. Authentication", description = "API quản lý xác thực")
public class AuthController {

    AuthService authService;
    AuthGoogleService authGoogleService;
    CookieProperties cookieProperties;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<?>> login(@RequestBody LoginRequest request, HttpServletResponse response) {
        LoginResponse loginResponse = authService.login(request);
        setCookies(response, loginResponse);

        return ResponseEntity.ok(ApiResponse.<LoginResponse>builder()
                .code(200)
                .message("Login successfully")
                .result(loginResponse)
                .build());
    }

    @PostMapping("/google")
    public ResponseEntity<ApiResponse<?>> loginGoogle(
            @RequestBody LoginGoogleRequest request,
            HttpServletResponse response
    ) {
        LoginGoogleResponse googleInfo = authGoogleService.authenticate(request.getCode());

        LoginResponse tokens = authService.loginWithGoogle(
                googleInfo.getEmail(),
                googleInfo.getName()
        );

        setCookies(response, tokens);

        return ResponseEntity.ok(ApiResponse.<LoginGoogleResponse>builder()
                .code(200)
                .message("Google Login successfully")
                .result(googleInfo)
                .build());
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<?>> refresh(HttpServletRequest request, HttpServletResponse response) {
        LoginResponse newTokens = authService.refresh(request);
        setCookies(response, newTokens);
        return ResponseEntity.ok(ApiResponse.<Void>builder().code(200).message("Refresh successfully").build());
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<?>> logout(HttpServletRequest request, HttpServletResponse response) {

        try {
            authService.logout(request);
        } catch (Exception e) {
            e.printStackTrace();
        }

        clearCookies(response);

        return ResponseEntity.ok(ApiResponse.<Void>builder().code(200).message("Logout successfully").build());
    }

    private void setCookies(HttpServletResponse response, LoginResponse tokens) {
        ResponseCookie accessCookie = ResponseCookie.from("access_token", tokens.getAccessToken())
                .httpOnly(true)
                .secure(cookieProperties.isSecure())
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ofMinutes(15))
                .build();

        ResponseCookie refreshCookie = ResponseCookie.from("refresh_token", tokens.getRefreshToken())
                .httpOnly(true)
                .secure(cookieProperties.isSecure())
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ofDays(7))
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());
    }

    private void clearCookies(HttpServletResponse response) {
        ResponseCookie accessCookie = ResponseCookie.from("access_token", "")
                .httpOnly(true)
                .secure(cookieProperties.isSecure())
                .path("/")
                .maxAge(0)
                .build();

        ResponseCookie refreshCookie = ResponseCookie.from("refresh_token", "")
                .httpOnly(true)
                .secure(cookieProperties.isSecure())
                .path("/")
                .maxAge(0)
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());
    }
}