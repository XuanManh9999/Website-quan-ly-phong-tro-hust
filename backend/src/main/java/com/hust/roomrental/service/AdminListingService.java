package com.hust.roomrental.service;

public interface AdminListingService {

    void approve(Long listingId);

    void reject(Long listingId);
}
