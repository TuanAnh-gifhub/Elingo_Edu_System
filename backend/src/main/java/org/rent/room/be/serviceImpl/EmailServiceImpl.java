package org.rent.room.be.serviceImpl;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.rent.room.be.dto.request.user.CreateUsersRequest;
import org.rent.room.be.service.EmailService;
import org.springframework.boot.mail.autoconfigure.MailProperties;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class EmailServiceImpl implements EmailService {

    JavaMailSender javaMailSender;
    MailProperties mailProperties;

    // Sử dụng ConcurrentHashMap để an toàn trong môi trường đa luồng
    // Key: Email, Value: VerificationData
    Map<String, VerificationData> pendingData = new ConcurrentHashMap<>();

    // Class nội bộ để lưu thông tin đăng ký tạm thời
    @Data
    @AllArgsConstructor
    private static class VerificationData {
        CreateUsersRequest userRequest;
        String otp;
        Instant expiryTime;
    }

    @Override
    public void sendResetPasswordEmail(String toEmail, String resetUrl) {
        // ... (Giữ nguyên code cũ của bạn) ...
    }

    // Hàm này sẽ vừa lưu user, vừa sinh OTP, vừa gửi mail
    @Override
    public void sendOtpRegister(CreateUsersRequest user) {
        // 1. Sinh mã OTP
        String otp = String.format("%06d", new Random().nextInt(999999));

        // 2. Lưu vào bộ nhớ tạm (Hết hạn sau 5 phút)
        VerificationData data = new VerificationData(
                user,
                otp,
                Instant.now().plusSeconds(300) // 5 phút = 300 giây
        );
        pendingData.put(user.getEmail(), data);

        // 3. Gửi email (Gọi hàm private bên dưới)
        sendEmailVerification(user.getEmail(), user.getUserName(), otp);
    }

    @Async
    protected void sendEmailVerification(String toEmail, String name, String otp) {
        // Lưu ý: Đã xóa logic sinh OTP ở đây, nhận OTP từ tham số
        String subject = "Mã OTP xác thực đăng ký";
        String content = """
                <!DOCTYPE html>
                <html lang="vi">
                <head>
                    <meta charset="UTF-8">
                    <style>
                        /* ... (Giữ nguyên style của bạn) ... */
                        .otp-box {
                            font-size: 24px; color: #e74c3c; font-weight: bold;
                            text-align: center; margin: 20px auto; padding: 15px 25px;
                            border: 2px dashed #e74c3c; border-radius: 8px;
                            background-color: #fff5f5; width: fit-content;
                        }
                    </style>
                </head>
                <body>
                    <div class="email-container">
                        <h1>Xin chào, %s!</h1>
                        <p>Chào mừng bạn đến với <strong>RentRoom</strong>.</p>
                        <div class="otp-box">Mã OTP của bạn là: %s</div>
                        <p>Vui lòng không chia sẻ mã này. Mã sẽ hết hạn sau 5 phút.</p>
                        <div class="footer">© 2025 RentRoom - Kết nối tri thức 💗</div>
                    </div>
                </body>
                </html>
                """.formatted(name, otp);
        sendEmail(toEmail, subject, content);
    }

    @Override
    public CreateUsersRequest verifyAndGetPendingUser(String email, String otp) {
        // 1. Kiểm tra email có tồn tại trong map không
        if (!pendingData.containsKey(email)) {
            throw new RuntimeException("Email chưa đăng ký hoặc mã xác thực đã hết hạn.");
        }

        VerificationData data = pendingData.get(email);

        // 2. Kiểm tra thời gian hết hạn
        if (Instant.now().isAfter(data.getExpiryTime())) {
            pendingData.remove(email); // Xóa data rác
            throw new RuntimeException("Mã OTP đã hết hạn. Vui lòng đăng ký lại.");
        }

        // 3. Kiểm tra mã OTP
        if (!data.getOtp().equals(otp)) {
            throw new RuntimeException("Mã OTP không chính xác.");
        }

        // 4. Nếu đúng hết -> Xóa khỏi map và trả về thông tin user
        pendingData.remove(email);
        return data.getUserRequest();
    }

    private void sendEmail(String to, String subject, String content) {
        MimeMessage message = javaMailSender.createMimeMessage();
        try {
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            assert mailProperties.getUsername() != null;
            helper.setFrom(mailProperties.getUsername());
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(content, true); // true để enable HTML

            javaMailSender.send(message);
        } catch (Exception e) {
            log.error("Lỗi khi gửi email: ", e);
        }
    }

    @Override
    @Async
    public void sendEmailToReporter(String userName, String reporterEmail, String content) {
        try {


            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(reporterEmail);
            helper.setSubject("Phản hồi báo cáo vi phạm");
            String plainText = "Xin chào " + userName + "\n" +
                    "Chúng tôi đã nhận được báo cáo vi phạm của bạn \n"
                    + content + "\n\n" +
                    "Email: " + mailProperties.getUsername() + "\n\n" +
                    "Trân trọng,\n" +
                    "Hệ thống EduRoom";

            String htmlText = """
                     <div class="email-response">
                        <h3>Xin chào %s</h3>
                        <h3>Chúng tôi đã nhận được báo cáo vi phạm của bạn</h3>
                        <p>
                           %s 
                        </p>
                     </div>
                    """.formatted(userName,content);
            helper.setText(plainText, htmlText);
            helper.setFrom(mailProperties.getUsername());
            javaMailSender.send(message);
        } catch (MessagingException e) {
            log.error(e.getMessage());
        }


    }
}