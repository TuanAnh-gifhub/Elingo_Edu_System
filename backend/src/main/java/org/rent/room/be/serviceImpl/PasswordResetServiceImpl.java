package org.rent.room.be.serviceImpl;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.entity.PasswordResetToken;
import org.rent.room.be.repository.mongo.PasswordResetTokenRepository;
import org.rent.room.be.service.PasswordResetService;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PasswordResetServiceImpl implements PasswordResetService {

    PasswordResetTokenRepository tokenRepository;

    private static final long EXPIRATION_SEC = 900;

    @Override
    public String createToken(String email) {
        // 1. Xóa token cũ nếu tồn tại để tránh rác (tùy chọn, nhưng khuyến khích)
        tokenRepository.deleteByEmail(email);

        // 2. Sinh chuỗi token ngẫu nhiên
        String tokenString = UUID.randomUUID().toString();

        // 3. Tính thời gian hết hạn
        Instant expiryDate = Instant.now().plusSeconds(EXPIRATION_SEC);

        // 4. Tạo đối tượng bằng Builder
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .email(email)
                .token(tokenString)
                .expiryDate(expiryDate)
                .build();

        // 5. Lưu vào DB
        tokenRepository.save(resetToken);

        return tokenString;
    }

    @Override
    public String validateToken(String token) {
        PasswordResetToken resetToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Token không hợp lệ hoặc không tồn tại"));

        // Kiểm tra hết hạn thủ công (đề phòng MongoDB chưa kịp xóa background)
        if (resetToken.getExpiryDate().isBefore(Instant.now())) {
            tokenRepository.delete(resetToken);
            throw new RuntimeException("Token đã hết hạn");
        }

        return resetToken.getEmail();
    }

    @Override
    public void deleteToken(String token) {
        // Sửa lỗi cú pháp: ifPresent trả về void, không gán vào biến
        tokenRepository.findByToken(token)
                .ifPresent(tokenRepository::delete);
    }
}