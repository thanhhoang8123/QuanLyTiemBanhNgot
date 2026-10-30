package com.nhom4.QuanLyTiemBanhNgot.controller;

import com.nhom4.QuanLyTiemBanhNgot.dto.payment.CreateVnPayPaymentRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.payment.VnPayPaymentInitiationResponse;
import com.nhom4.QuanLyTiemBanhNgot.service.CustomerVnPayService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/customer/payments/vnpay")
@PreAuthorize("hasAnyRole('CUSTOMER','ADMIN','MANAGER','STAFF')")
public class CustomerVnPayController {

    private final CustomerVnPayService customerVnPayService;

    public CustomerVnPayController(CustomerVnPayService customerVnPayService) {
        this.customerVnPayService = customerVnPayService;
    }

    @PostMapping
    public VnPayPaymentInitiationResponse createPayment(
            Authentication authentication,
            @Valid @RequestBody CreateVnPayPaymentRequest request,
            HttpServletRequest httpRequest) {
        return customerVnPayService.createPayment(
                authentication == null ? null : authentication.getName(),
                request,
                httpRequest.getRemoteAddr()
        );
    }
}
