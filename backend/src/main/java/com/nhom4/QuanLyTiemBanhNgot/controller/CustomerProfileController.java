package com.nhom4.QuanLyTiemBanhNgot.controller;

import com.nhom4.QuanLyTiemBanhNgot.dto.customer.CustomerProfileRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.customer.CustomerProfileResponse;
import com.nhom4.QuanLyTiemBanhNgot.service.CustomerProfileService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/customer/profile")
@PreAuthorize("hasAnyRole('CUSTOMER','ADMIN','MANAGER','STAFF')")
public class CustomerProfileController {
    private final CustomerProfileService customerProfileService;

    public CustomerProfileController(CustomerProfileService customerProfileService) {
        this.customerProfileService = customerProfileService;
    }

    @GetMapping
    public CustomerProfileResponse getProfile(Authentication authentication) {
        return customerProfileService.getProfile(authentication.getName());
    }

    @PutMapping
    public CustomerProfileResponse updateProfile(
            Authentication authentication,
            @Valid @RequestBody CustomerProfileRequest request) {
        return customerProfileService.updateProfile(authentication.getName(), request);
    }
}
