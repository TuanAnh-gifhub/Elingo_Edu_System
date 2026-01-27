package org.rent.room.be.serviceImpl;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.rent.room.be.service.EmailService;
import org.springframework.boot.mail.autoconfigure.MailProperties;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class EmailServiceImpl implements EmailService {

    JavaMailSender javaMailSender;
    MailProperties mailProperties;

    @Async
    public void sendResetPasswordEmail(String toEmail, String resetUrl) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();

            message.setFrom(mailProperties.getUsername());
            message.setTo(toEmail);
            message.setSubject("Yêu cầu đặt lại mật khẩu - Rent Room App");
            message.setText("Chào bạn,\n\n"
                    + "Bạn vừa yêu cầu đặt lại mật khẩu. Vui lòng nhấn vào link bên dưới để tiếp tục:\n\n"
                    + resetUrl + "\n\n"
                    + "Link này sẽ hết hạn sau 15 phút.\n"
                    + "Nếu bạn không yêu cầu, vui lòng bỏ qua email này.");

            javaMailSender.send(message);
            log.info("Đã gửi email reset password thành công tới: {}", toEmail);

        } catch (Exception e) {
            log.error("Lỗi khi gửi email: ", e);
        }
    }
}
