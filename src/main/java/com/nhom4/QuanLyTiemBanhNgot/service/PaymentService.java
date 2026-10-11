package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.entity.Payment;
import com.nhom4.QuanLyTiemBanhNgot.repository.PaymentRepository;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service xử lý thông tin thanh toán.
 */
@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;

    /**
     * Constructor Injection.
     */
    public PaymentService(PaymentRepository paymentRepository) {
        this.paymentRepository = paymentRepository;
    }

    /**
     * Lấy tất cả thanh toán.
     */
    public List<Payment> findAll() {
        return paymentRepository.findAll();
    }

    /**
     * Tìm thanh toán theo ID.
     */
    public Payment findById(Long id) {
        return paymentRepository.findById(id)
                .orElse(null);
    }

    /**
     * Thêm hoặc cập nhật thanh toán.
     */
    public Payment save(Payment payment) {
        return paymentRepository.save(payment);
    }

    /**
     * Xóa thanh toán.
     */
    public void deleteById(Long id) {
        paymentRepository.deleteById(id);
    }
}