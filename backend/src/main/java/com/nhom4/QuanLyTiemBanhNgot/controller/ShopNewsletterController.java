package com.nhom4.QuanLyTiemBanhNgot.controller;

import com.nhom4.QuanLyTiemBanhNgot.dto.shop.NewsletterSubscriptionRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.shop.NewsletterSubscriptionResponse;
import com.nhom4.QuanLyTiemBanhNgot.service.ShopNewsletterService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/shop/newsletter")
public class ShopNewsletterController {
    private final ShopNewsletterService shopNewsletterService;

    public ShopNewsletterController(ShopNewsletterService shopNewsletterService) {
        this.shopNewsletterService = shopNewsletterService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public NewsletterSubscriptionResponse subscribe(
            @Valid @RequestBody NewsletterSubscriptionRequest request) {
        shopNewsletterService.subscribe(request.email());
        return new NewsletterSubscriptionResponse("Đã đăng ký nhận tin từ WA Patisserie.");
    }
}
