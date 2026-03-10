package org.rent.room.be.constant;

public enum AuthProvider {
    LOCAL,    // Đăng ký qua form email/password
    GOOGLE,   // Đăng nhập qua Google
    BOTH      // Đã có cả mật khẩu và liên kết Google
}