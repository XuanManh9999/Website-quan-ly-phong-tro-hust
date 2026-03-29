package com.hust.roomrental.service.impl;

import com.hust.roomrental.domain.enums.ArticleStatus;
import com.hust.roomrental.domain.enums.ListingStatus;
import com.hust.roomrental.domain.enums.PaymentOrderStatus;
import com.hust.roomrental.domain.enums.UserRole;
import com.hust.roomrental.repository.ArticleRepository;
import com.hust.roomrental.repository.ListingRepository;
import com.hust.roomrental.repository.PaymentOrderRepository;
import com.hust.roomrental.repository.UserRepository;
import com.hust.roomrental.service.AdminAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminAnalyticsServiceImpl implements AdminAnalyticsService {

    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final ArticleRepository articleRepository;
    private final PaymentOrderRepository paymentOrderRepository;

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> overview() {
        Instant monthStart = Instant.now().minus(30, ChronoUnit.DAYS);
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("usersSeeker", userRepository.countByRole(UserRole.SEEKER));
        map.put("usersLandlord", userRepository.countByRole(UserRole.LANDLORD));
        map.put("listingsPublished", listingRepository.countByStatus(ListingStatus.PUBLISHED));
        map.put("listingsPending", listingRepository.countByStatus(ListingStatus.PENDING_REVIEW));
        map.put("articlesPublished", articleRepository.countByStatus(ArticleStatus.PUBLISHED));
        BigDecimal revenue = paymentOrderRepository.sumPaidAmountBetween(
                PaymentOrderStatus.PAID, monthStart, Instant.now());
        map.put("revenueLast30DaysVnd", revenue != null ? revenue : BigDecimal.ZERO);
        map.put("generatedAt", Instant.now().toString());
        return map;
    }
}
