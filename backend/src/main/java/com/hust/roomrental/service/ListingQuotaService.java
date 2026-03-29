package com.hust.roomrental.service;

import com.hust.roomrental.config.AppProperties;
import com.hust.roomrental.domain.entity.User;
import com.hust.roomrental.repository.ListingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;

@Service
@RequiredArgsConstructor
public class ListingQuotaService {

    private final ListingRepository listingRepository;
    private final AppProperties appProperties;

    public boolean canPublishOneMore(User owner) {
        ZoneId zone = ZoneId.systemDefault();
        ZonedDateTime startOfMonth = ZonedDateTime.now(zone).withDayOfMonth(1).toLocalDate().atStartOfDay(zone);
        ZonedDateTime startOfNextMonth = startOfMonth.plusMonths(1);
        Instant start = startOfMonth.toInstant();
        Instant end = startOfNextMonth.toInstant();
        long used = listingRepository.countPublishedInMonth(owner.getId(), start, end);
        int allowed = appProperties.getListing().getDefaultQuotaPerMonth() + owner.getBonusListingSlots();
        return used < allowed;
    }
}
