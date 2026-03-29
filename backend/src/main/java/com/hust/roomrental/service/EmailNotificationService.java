package com.hust.roomrental.service;

public interface EmailNotificationService {

    void sendOtpEmail(String to, String code);

    void sendGeneric(String to, String subject, String body);
}
