package com.nhom4.QuanLyTiemBanhNgot.controller;

import com.nhom4.QuanLyTiemBanhNgot.dto.payment.VnPayReconciliationResponse;
import com.nhom4.QuanLyTiemBanhNgot.service.VnPayReconciliationService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/customer/payments/vnpay")
@PreAuthorize("hasRole('CUSTOMER')")
public class CustomerVnPayReconciliationController {

    private final VnPayReconciliationService reconciliationService;

    public CustomerVnPayReconciliationController(
            VnPayReconciliationService reconciliationService) {
        this.reconciliationService = reconciliationService;
    }

    @PostMapping("/{transactionReference}/reconcile")
    public VnPayReconciliationResponse reconcile(
            Authentication authentication,
            @PathVariable String transactionReference) {
        return reconciliationService.reconcile(
                authentication == null ? null : authentication.getName(),
                transactionReference
        );
    }
}
