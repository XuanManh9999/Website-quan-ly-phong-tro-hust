package com.hust.roomrental.controller;

import com.hust.roomrental.service.AdminAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Map;
import java.util.regex.Pattern;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin")
public class AdminController {

    private static final ZoneId VIETNAM = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final Pattern YMD = Pattern.compile("^\\d{4}-\\d{2}-\\d{2}$");

    private final AdminAnalyticsService adminAnalyticsService;

    @GetMapping("/summary")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> summary(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to
    ) {
        LocalDate[] range = normalizeRange(from, to);
        return adminAnalyticsService.dashboardSummary(range[0], range[1]);
    }

    private static LocalDate[] normalizeRange(String from, String to) {
        LocalDate defStart = LocalDate.now(VIETNAM).withDayOfMonth(1);
        LocalDate defEnd = LocalDate.now(VIETNAM).withDayOfMonth(LocalDate.now(VIETNAM).lengthOfMonth());
        if (from == null || to == null || !YMD.matcher(from).matches() || !YMD.matcher(to).matches()) {
            return new LocalDate[]{defStart, defEnd};
        }
        LocalDate df = LocalDate.parse(from);
        LocalDate dt = LocalDate.parse(to);
        return new LocalDate[]{df, dt};
    }
}
