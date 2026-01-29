package org.rent.room.be.serviceImpl;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.rent.room.be.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailServiceImpl implements EmailService {
    //    @Autowired
//    private JavaMailSender mailSender;
    @Autowired
    private JavaMailSender mailSender;
    @Value("${spring.mail.username}")
    private String emailSender;

    @Override
    @Async
    public void sendEmailToReporter(String userName, String reporterEmail, String content) {
        try {

            System.err.println(emailSender);
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(reporterEmail);
            helper.setSubject("Phản hồi báo cáo vi phạm");
            String plainText = "Xin chào " + userName + "\n" +
                    "Chúng tôi đã nhận được báo cáo vi phạm của bạn \n"
                    + content + "\n\n" +
                    "Email: " + mailSender + "\n\n" +
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
            helper.setFrom(emailSender);
            mailSender.send(message);
        } catch (MessagingException e) {
            log.error(e.getMessage());
        }


    }
}
