package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.entity.NewsletterSubscription;
import com.nhom4.QuanLyTiemBanhNgot.repository.NewsletterSubscriptionRepository;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ShopNewsletterServiceTests {
    @Test
    void subscribeNormalizesEmailAndStoresConsent() {
        NewsletterSubscriptionRepository repository = mock(NewsletterSubscriptionRepository.class);
        when(repository.findByEmailIgnoreCase("person@example.com")).thenReturn(Optional.empty());
        when(repository.save(any(NewsletterSubscription.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        ShopNewsletterService service = new ShopNewsletterService(repository);

        service.subscribe("  PERSON@EXAMPLE.COM ");

        var captor = org.mockito.ArgumentCaptor.forClass(NewsletterSubscription.class);
        verify(repository).save(captor.capture());
        NewsletterSubscription saved = captor.getValue();
        assertEquals("person@example.com", saved.getEmail());
        assertEquals(true, saved.isActive());
        org.junit.jupiter.api.Assertions.assertNotNull(saved.getConsentedAt());
    }

    @Test
    void subscribeReactivatesExistingSubscription() {
        NewsletterSubscriptionRepository repository = mock(NewsletterSubscriptionRepository.class);
        NewsletterSubscription existing = new NewsletterSubscription();
        existing.setEmail("person@example.com");
        existing.setActive(false);
        when(repository.findByEmailIgnoreCase("person@example.com")).thenReturn(Optional.of(existing));
        when(repository.save(existing)).thenReturn(existing);
        ShopNewsletterService service = new ShopNewsletterService(repository);

        service.subscribe("person@example.com");

        assertEquals(true, existing.isActive());
        org.junit.jupiter.api.Assertions.assertNotNull(existing.getConsentedAt());
        verify(repository).save(existing);
    }
}
