package com.nhom4.QuanLyTiemBanhNgot.controller;

import com.nhom4.QuanLyTiemBanhNgot.dto.payment.VnPayPaymentStatusResponse;
import com.nhom4.QuanLyTiemBanhNgot.service.CustomerVnPayStatusService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/customer/payments/vnpay")
@PreAuthorize("hasAnyRole('CUSTOMER','ADMIN','MANAGER','STAFF')")
public class CustomerVnPayStatusController {

    private final CustomerVnPayStatusService statusService;

    public CustomerVnPayStatusController(CustomerVnPayStatusService statusService) {
        this.statusService = statusService;
    }

    @GetMapping("/{transactionReference}")
    public VnPayPaymentStatusResponse getStatus(
            Authentication authentication,
            @PathVariable String transactionReference) {
        return statusService.getStatus(
                authentication == null ? null : authentication.getName(),
                transactionReference
        );
    }

    @GetMapping("/by-order/{orderId}")
    public VnPayPaymentStatusResponse getLatestStatusByOrderId(
            Authentication authentication,
            @PathVariable Long orderId) {
        return statusService.getLatestStatusByOrderId(
                authentication == null ? null : authentication.getName(),
                orderId
        );
    }
}
