package org.rent.room.be.serviceImpl;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.rent.room.be.constant.AuthProvider;
import org.rent.room.be.entity.Role;
import org.rent.room.be.repository.RoleRepository;
import org.rent.room.be.utils.Hash;
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
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final JwtDecoder jwtDecoder;
    private final CustomUserDetailsService userDetailsService;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    @Override
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (user.getPasswordHash() == null) {
            throw new AppException(ErrorCode.SOCIAL_ACCOUNT_REQUIRED);
        }

        if (Boolean.FALSE.equals(user.getEmailVerified())) {
            throw new AppException(ErrorCode.EMAIL_NOT_VERIFIED);
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            assert userDetails != null;
            return generateAndSaveTokens(userDetails);
        } catch (BadCredentialsException e) {
            throw new AppException(ErrorCode.LOGIN_FAILED);
        }
    }

    @Override
    @Transactional
    public LoginResponse loginWithGoogle(String email, String name, String googleId) {
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            Role renterRole = roleRepository.findByRoleName("STUDENT")
                    .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));

            user = User.builder()
                    .email(email)
                    .userName(name)
                    .googleId(googleId)
                    .role(renterRole)
                    .active(true)
                    .provider(AuthProvider.GOOGLE)
                    .passwordHash(null)
                    .emailVerified(true)
                    .build();

            userRepository.save(user);
        } else {
            user.setGoogleId(googleId);
            user.setUserName(name);

            if (user.getProvider() == AuthProvider.LOCAL) {
                user.setProvider(AuthProvider.BOTH);
            }

            if (user.getEmailVerified() == null) {
                user.setEmailVerified(true);
            }

            userRepository.save(user);
        }

        CustomUserDetails userDetails = (CustomUserDetails) userDetailsService.loadUserByUsername(email);
        return generateAndSaveTokens(userDetails);
    }

    @Override
    @Transactional
    public LoginResponse refresh(HttpServletRequest request) {

        log.info("REFRESH_SERVICE start");

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new AppException(ErrorCode.REFRESH_TOKEN_NOT_FOUND);
        }

        String refreshToken = authHeader.substring(7);

        log.info("REFRESH_SERVICE refresh_token present=true");

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

        if (!"refresh".equals(jwt.getClaim("type"))) {
            throw new AppException(ErrorCode.INVALID_TOKEN_TYPE);
        }

        if (stored.getExpiresAt().isBefore(Instant.now())) {
            stored.setRevoked(true);
            refreshTokenRepository.save(stored);
            throw new AppException(ErrorCode.REFRESH_TOKEN_EXPIRED);
        }

        String email = jwt.getClaim("email");

        CustomUserDetails user =
                (CustomUserDetails) userDetailsService.loadUserByUsername(email);

        return generateAndSaveTokens(user);
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

}
