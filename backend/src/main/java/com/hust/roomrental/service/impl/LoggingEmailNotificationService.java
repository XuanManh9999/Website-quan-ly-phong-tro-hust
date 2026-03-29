package com.hust.roomrental.service.impl;

import com.hust.roomrental.service.EmailNotificationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class LoggingEmailNotificationService implements EmailNotificationService {

    @Override
    public void sendOtpEmail(String to, String code) {
        log.info("[DEV EMAIL] OTP to {}: {}", to, code);
    }

    @Override
    public void sendGeneric(String to, String subject, String body) {
        log.info("[DEV EMAIL] to={} subject={}\n{}", to, subject, body);
    }
}
