package org.rent.room.be.service;

public interface PasswordResetService {
    String createToken(String email);

    String validateToken(String token);

    void deleteToken(String token);
}
