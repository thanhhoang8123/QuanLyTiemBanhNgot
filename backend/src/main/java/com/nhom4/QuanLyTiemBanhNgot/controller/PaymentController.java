package com.nhom4.QuanLyTiemBanhNgot.controller;

import com.nhom4.QuanLyTiemBanhNgot.dto.payment.CreatePaymentRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.payment.PaymentResponse;
import com.nhom4.QuanLyTiemBanhNgot.dto.payment.SimulatePaymentRequest;
import com.nhom4.QuanLyTiemBanhNgot.service.PaymentService;
import jakarta.validation.Valid;
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
    public List<PaymentResponse> getAllPayments() {
        return paymentService.findAll();
    }

    /**
     * GET /api/payments/{id}
     *
     * Lấy một thanh toán theo ID.
     */
    @GetMapping("/{id}")
    public PaymentResponse getPaymentById(@PathVariable Long id) {
        return paymentService.findById(id);
    }

    /**
     * POST /api/payments
     *
     * Tạo thanh toán mới.
     */
    @PostMapping
    public PaymentResponse createPayment(
            @Valid @RequestBody CreatePaymentRequest request) {
        return paymentService.create(request);
    }

    /**
     * POST /api/payments/{id}/simulate
     *
     * Mô phỏng kết quả thanh toán SUCCESS hoặc FAILED.
     */
    @PostMapping("/{id}/simulate")
    public PaymentResponse simulatePayment(
            @PathVariable Long id,
            @Valid @RequestBody SimulatePaymentRequest request) {
        return paymentService.simulate(id, request);
    }

    /**
     * PUT /api/payments/{id}
     *
     * Đường dẫn được giữ nguyên; cập nhật trực tiếp chưa được hỗ trợ nghiệp vụ.
     */
    @PutMapping("/{id}")
    public void updatePayment(@PathVariable Long id) {
        paymentService.update(id);
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