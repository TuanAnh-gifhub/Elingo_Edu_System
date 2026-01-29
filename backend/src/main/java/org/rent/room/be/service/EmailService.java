package org.rent.room.be.service;

import org.rent.room.be.dto.request.user.CreateUsersRequest;

public interface EmailService {
    void sendResetPasswordEmail(String toEmail, String resetUrl);
    void sendOtpRegister(CreateUsersRequest user);
    CreateUsersRequest verifyAndGetPendingUser(String email, String otp);
}