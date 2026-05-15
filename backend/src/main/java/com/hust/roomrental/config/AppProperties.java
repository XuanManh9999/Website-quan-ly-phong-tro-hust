package com.hust.roomrental.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private final Jwt jwt = new Jwt();
    private final Cors cors = new Cors();
    private final Vnpay vnpay = new Vnpay();
    private final Gemini gemini = new Gemini();
    private final Listing listing = new Listing();
    private final Chat chat = new Chat();

    @Getter
    @Setter
    public static class Jwt {
        private String secret;
        private long expirationMs;
    }

    @Getter
    @Setter
    public static class Cors {
        private String allowedOrigins;
    }

    @Getter
    @Setter
    public static class Vnpay {
        private String tmnCode;
        private String hashSecret;
        private String paymentUrl;
        private String returnUrl;
        private String ipnUrl;
    }

    @Getter
    @Setter
    public static class Gemini {
        private String apiKey;
        private String model;
        private String apiUrl;
        /** Gemini sampling temperature (0–2). */
        private double temperature = 0.65;
        /** Max tokens for model reply. */
        private int maxOutputTokens = 1024;
    }

    @Getter
    @Setter
    public static class Listing {
        private int defaultQuotaPerMonth;
    }

    @Getter
    @Setter
    public static class Chat {
        /** Giới hạn lượt dùng chatbot mỗi IP / ngày (MVP). */
        private int maxRequestsPerIpPerDay = 60;
        /** Giới hạn độ dài prompt gửi Gemini để tránh abuse. */
        private int maxMessageChars = 1200;
        /** Tóm tắt hội thoại cũ gửi kèm (ký tự). */
        private int maxHistoryChars = 3200;
        /** Giới hạn tổng blob user (listings + history + message) gửi Gemini. */
        private int maxTotalPromptChars = 12000;
    }
}
