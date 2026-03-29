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
    }

    @Getter
    @Setter
    public static class Listing {
        private int defaultQuotaPerMonth;
    }
}
