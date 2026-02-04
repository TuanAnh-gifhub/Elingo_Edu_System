package org.rent.room.be.service;

import jakarta.servlet.http.HttpServletRequest;
import org.rent.room.be.dto.request.auth.LoginRequest;
import org.rent.room.be.dto.response.auth.LoginResponse;

public interface AuthService {

    LoginResponse login(LoginRequest loginRequest);

    LoginResponse refresh(HttpServletRequest refreshRequest);

    LoginResponse loginWithGoogle(String email, String name, String googleId);
}
