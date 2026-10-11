package com.nhom4.QuanLyTiemBanhNgot.controller;

import com.nhom4.QuanLyTiemBanhNgot.entity.Payment;
import com.nhom4.QuanLyTiemBanhNgot.service.PaymentService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller cho bảng payments.
 *
 * Đường dẫn:
 * /api/payments
 */
@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    /**
     * Constructor Injection.
     */
    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    /**
     * GET /api/payments
     *
     * Lấy tất cả thanh toán.
     */
    @GetMapping
    public List<Payment> getAllPayments() {
        return paymentService.findAll();
    }

    /**
     * GET /api/payments/{id}
     *
     * Lấy một thanh toán theo ID.
     */
    @GetMapping("/{id}")
    public Payment getPaymentById(@PathVariable Long id) {
        return paymentService.findById(id);
    }

    /**
     * POST /api/payments
     *
     * Tạo thanh toán mới.
     */
    @PostMapping
    public Payment createPayment(
            @RequestBody Payment payment) {

        return paymentService.save(payment);
    }

    /**
     * PUT /api/payments/{id}
     *
     * Cập nhật thanh toán.
     */
    @PutMapping("/{id}")
    public Payment updatePayment(
            @PathVariable Long id,
            @RequestBody Payment payment) {

        payment.setId(id);

        return paymentService.save(payment);
    }

    /**
     * DELETE /api/payments/{id}
     *
     * Xóa thanh toán.
     */
    @DeleteMapping("/{id}")
    public void deletePayment(@PathVariable Long id) {
        paymentService.deleteById(id);
    }
}