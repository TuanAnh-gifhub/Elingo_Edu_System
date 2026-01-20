package org.rent.room.be.serviceImpl;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.Utils.Hash;
import org.rent.room.be.constant.Role;
import org.rent.room.be.dto.request.auth.LoginRequest;
import org.rent.room.be.dto.response.auth.LoginResponse;
import org.rent.room.be.entity.RefreshToken;
import org.rent.room.be.entity.User;
import org.rent.room.be.exception.AppException;
import org.rent.room.be.exception.ErrorCode;
import org.rent.room.be.repository.UserRepository;
import org.rent.room.be.repository.mongo.RefreshTokenRepository;
import org.rent.room.be.security.CustomUserDetails;
import org.rent.room.be.security.CustomUserDetailsService;
import org.rent.room.be.security.JwtService;
import org.rent.room.be.service.AuthService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthServiceImpl implements AuthService {

    AuthenticationManager authenticationManager;
    JwtService jwtService;
    JwtDecoder jwtDecoder;
    CustomUserDetailsService userDetailsService;
    RefreshTokenRepository refreshTokenRepository;
    UserRepository userRepository;
    PasswordEncoder passwordEncoder;

    @Override
    public LoginResponse login(LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
            CustomUserDetails user = (CustomUserDetails) authentication.getPrincipal();
            return generateAndSaveTokens(user);
        } catch (BadCredentialsException e) {
            throw new AppException(ErrorCode.LOGIN_FAILED);
        }
    }

    @Override
    @Transactional
    public LoginResponse loginWithGoogle(String email, String name, String avatar) {
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            user = new User();
            user.setEmail(email);
            user.setUserName(name);
            user.setRole(Role.MEMBER);
            user.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));
            user.setActive(true);

            try {
                userRepository.save(user);
            } catch (DataIntegrityViolationException e) {
                user = userRepository.findByEmail(email)
                        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
            }
        } else {
            user.setUserName(name);
            userRepository.save(user);
        }

        CustomUserDetails userDetails = (CustomUserDetails) userDetailsService.loadUserByUsername(email);

        return generateAndSaveTokens(userDetails);
    }

    @Override
    @Transactional
    public LoginResponse refresh(HttpServletRequest request) {

        String refreshToken = extractCookie(request, "refresh_token");

        if (refreshToken == null) {
            throw new AppException(ErrorCode.REFRESH_TOKEN_NOT_FOUND);
        }
        String hash = Hash.hashToken(refreshToken);
        RefreshToken stored = refreshTokenRepository
                .findByTokenHashAndRevokedFalse(hash)
                .orElseThrow(() -> new AppException(ErrorCode.REFRESH_TOKEN_REVOKED));

        Jwt jwt = jwtDecoder.decode(refreshToken);
        if (!"refresh".equals(jwt.getClaim("type"))) {
            throw new AppException(ErrorCode.INVALID_TOKEN_TYPE);
        }

        String email = jwt.getClaim("email");

        stored.setRevoked(true);
        refreshTokenRepository.save(stored);

        CustomUserDetails user = (CustomUserDetails) userDetailsService.loadUserByUsername(email);
        return generateAndSaveTokens(user);
    }

    @Override
    @Transactional
    public void logout(HttpServletRequest request) {

        String accessToken = extractCookie(request, "access_token");
        if (accessToken == null) return;

        Jwt jwt = jwtDecoder.decode(accessToken);
        String email = jwt.getSubject();
        refreshTokenRepository.deleteByEmail(email);
    }

    private LoginResponse generateAndSaveTokens(CustomUserDetails user) {
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        RefreshToken entity = new RefreshToken();
        entity.setTokenHash(Hash.hashToken(refreshToken));
        entity.setEmail(user.getUsername());
        entity.setExpiresAt(Instant.now().plusSeconds(7 * 24 * 60 * 60)); // 7 ngày
        entity.setRevoked(false);

        refreshTokenRepository.save(entity);

        return new LoginResponse(accessToken, refreshToken);
    }

    private String extractCookie(HttpServletRequest request, String name) {
        if (request.getCookies() == null) return null;
        for (Cookie cookie : request.getCookies()) {
            if (name.equals(cookie.getName())) return cookie.getValue();
        }
        return null;
    }
}
