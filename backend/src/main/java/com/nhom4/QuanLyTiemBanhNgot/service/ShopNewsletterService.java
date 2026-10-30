package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.entity.NewsletterSubscription;
import com.nhom4.QuanLyTiemBanhNgot.repository.NewsletterSubscriptionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Locale;

@Service
public class ShopNewsletterService {
    private final NewsletterSubscriptionRepository repository;

    public ShopNewsletterService(NewsletterSubscriptionRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public void subscribe(String email) {
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        NewsletterSubscription subscription = repository.findByEmailIgnoreCase(normalizedEmail)
                .orElseGet(NewsletterSubscription::new);

        subscription.setEmail(normalizedEmail);
        subscription.setConsentedAt(LocalDateTime.now());
        subscription.setActive(true);
        repository.save(subscription);
    }
}
