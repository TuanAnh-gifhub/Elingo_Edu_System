package org.rent.room.be.serviceImpl;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.rent.room.be.utils.Hash;
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
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Slf4j
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
    public LoginResponse loginWithGoogle(String email, String name) {
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            user = new User();
            user.setEmail(email);
            user.setUserName(name);
            user.setRole(Role.RENTER);
            user.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));
            user.setActive(true);

            try {
                userRepository.save(user);
            } catch (DataIntegrityViolationException e) {
                userRepository.findByEmail(email)
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

        log.info("REFRESH_SERVICE start");

        String refreshToken = extractCookie(request, "refresh_token");

        log.info("REFRESH_SERVICE refresh_token present={}", refreshToken != null);

        if (refreshToken == null) {
            throw new AppException(ErrorCode.REFRESH_TOKEN_NOT_FOUND);
        }
        String hash = Hash.hashToken(refreshToken);
        RefreshToken stored = refreshTokenRepository
                .findByTokenHashAndRevokedFalse(hash)
                .orElseThrow(() -> new AppException(ErrorCode.REFRESH_TOKEN_REVOKED));

        Jwt jwt;
        try {
            jwt = jwtDecoder.decode(refreshToken);
        } catch (JwtException e) {
            throw new AppException(ErrorCode.REFRESH_TOKEN_EXPIRED);
        }

        log.info("REFRESH_SERVICE token type={}", Optional.ofNullable(jwt.getClaim("type")));
        log.info("REFRESH_SERVICE email={}", Optional.ofNullable(jwt.getClaim("email")));

        if (!"refresh".equals(jwt.getClaim("type"))) {
            throw new AppException(ErrorCode.INVALID_TOKEN_TYPE);
        }

        String email = jwt.getClaim("email");

        log.info("REFRESH_SERVICE revoke old refresh");

        if (stored.getExpiresAt().isBefore(Instant.now())) {
            stored.setRevoked(true);
            refreshTokenRepository.save(stored);
            throw new AppException(ErrorCode.REFRESH_TOKEN_EXPIRED);
        }

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

        log.info("TOKEN_GENERATOR generating access & refresh for {}", user.getUsername());

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
