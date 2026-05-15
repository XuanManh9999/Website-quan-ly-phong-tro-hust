package com.hust.roomrental.service.impl;

import com.hust.roomrental.service.EmailNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnExpression("'${spring.mail.host:}' != ''")
public class SmtpEmailNotificationService implements EmailNotificationService {

    private final JavaMailSender mailSender;

    @Value("${app.email.from:}")
    private String from;

    @Value("${app.email.from-name:QL Phòng Trọ}")
    private String fromName;

    @Override
    public void sendOtpEmail(String to, String code) {
        String subject = "Mã OTP đặt lại mật khẩu";
        String body = """
                Xin chào,

                Mã OTP của bạn là: %s
                Mã có hiệu lực trong 10 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.

                Nếu bạn không yêu cầu đặt lại mật khẩu, bạn có thể bỏ qua email này.

                Trân trọng,
                %s
                """.formatted(code, fromName);
        sendGeneric(to, subject, body);
    }

    @Override
    public void sendGeneric(String to, String subject, String body) {
        if (to == null || to.isBlank()) return;
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setTo(to);
        msg.setSubject(subject);
        msg.setText(body);
        if (from != null && !from.isBlank()) {
            msg.setFrom(fromName != null && !fromName.isBlank() ? ("%s <%s>".formatted(fromName, from)) : from);
        }
        mailSender.send(msg);
        log.info("Sent email to={} subject={}", to, subject);
    }
}

