package com.hust.roomrental.service;

import java.time.LocalDate;
import java.util.Map;

public interface AdminAnalyticsService {

    Map<String, Object> overview();

    /**
     * JSON giống {@code GET /admin/summary} của Node (dashboard admin SPA).
     */
    Map<String, Object> dashboardSummary(LocalDate from, LocalDate to);
}
