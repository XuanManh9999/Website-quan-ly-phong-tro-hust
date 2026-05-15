package com.hust.roomrental.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicReference;

@RestController
@RequestMapping("/locations")
@Slf4j
public class LocationsController {

    private static final long CACHE_TTL_MS = 6 * 60 * 60 * 1000L;
    private final AtomicReference<List<Object>> provincesCache = new AtomicReference<>();
    private final AtomicLong cachedAt = new AtomicLong(0L);
    private final RestTemplate restTemplate;

    public LocationsController() {
        SimpleClientHttpRequestFactory f = new SimpleClientHttpRequestFactory();
        f.setConnectTimeout(10_000);
        f.setReadTimeout(30_000);
        this.restTemplate = new RestTemplate(f);
    }

    @GetMapping("/provinces")
    public Map<String, Object> provinces() {
        long now = System.currentTimeMillis();
        List<Object> cached = provincesCache.get();
        if (cached != null && (now - cachedAt.get()) < CACHE_TTL_MS) {
            return Map.of("provinces", cached, "source", "cache");
        }
        try {
            Object[] remote = restTemplate.getForObject("https://provinces.open-api.vn/api/?depth=3", Object[].class);
            List<Object> list = remote == null ? List.of() : java.util.Arrays.asList(remote);
            provincesCache.set(list);
            cachedAt.set(now);
            return Map.of("provinces", list, "source", "remote");
        } catch (Exception ex) {
            // Máy không ra internet / firewall / SSL → tránh 500 toàn trang; không cache lỗi để lần sau thử lại.
            log.warn("Failed to fetch provinces from provinces.open-api.vn", ex);
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("provinces", List.of());
            body.put("source", "remote_error");
            body.put("message", "Không thể tải danh sách tỉnh/thành từ nguồn ngoài. Kiểm tra mạng hoặc firewall.");
            return body;
        }
    }
}
