package org.rent.room.be.service;

public interface EmailService {
    void sendResetPasswordEmail(String toEmail, String resetUrl);
}
