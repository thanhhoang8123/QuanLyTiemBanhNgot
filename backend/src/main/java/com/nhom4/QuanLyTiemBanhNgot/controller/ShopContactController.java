package com.nhom4.QuanLyTiemBanhNgot.controller;

import com.nhom4.QuanLyTiemBanhNgot.dto.shop.ContactMessageResponse;
import com.nhom4.QuanLyTiemBanhNgot.dto.shop.ContactRequest;
import com.nhom4.QuanLyTiemBanhNgot.entity.Customer;
import com.nhom4.QuanLyTiemBanhNgot.service.AuthenticatedCustomerResolver;
import com.nhom4.QuanLyTiemBanhNgot.service.ContactMessageService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/shop/contact")
public class ShopContactController {
    private final ContactMessageService contactMessageService;
    private final AuthenticatedCustomerResolver customerResolver;

    public ShopContactController(
            ContactMessageService contactMessageService,
            AuthenticatedCustomerResolver customerResolver) {
        this.contactMessageService = contactMessageService;
        this.customerResolver = customerResolver;
    }

    @PostMapping
    public ContactMessageResponse sendMessage(
            Authentication authentication,
            @Valid @RequestBody ContactRequest request) {
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equalsIgnoreCase(authentication.getName())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập tài khoản để gửi tin nhắn hỗ trợ.");
        }
        Customer customer = customerResolver.requireActiveCustomer(authentication.getName());
        return contactMessageService.create(request, customer);
    }

    @GetMapping("/my-messages")
    public List<ContactMessageResponse> getMyMessages(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equalsIgnoreCase(authentication.getName())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập tài khoản để xem tin nhắn hỗ trợ.");
        }
        Customer customer = customerResolver.requireActiveCustomer(authentication.getName());
        return contactMessageService.findByCustomer(customer);
    }
}
