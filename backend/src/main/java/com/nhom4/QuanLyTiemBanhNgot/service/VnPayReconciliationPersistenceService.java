package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.dto.payment.VnPayPaymentStatusResponse;
import com.nhom4.QuanLyTiemBanhNgot.entity.Order;
import com.nhom4.QuanLyTiemBanhNgot.entity.Payment;
import com.nhom4.QuanLyTiemBanhNgot.entity.PaymentTransactionAttempt;
import com.nhom4.QuanLyTiemBanhNgot.exception.ResourceNotFoundException;
import com.nhom4.QuanLyTiemBanhNgot.repository.OrderRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.PaymentRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.PaymentTransactionAttemptRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Service
public class VnPayReconciliationPersistenceService {

    private static final String RECONCILIATION_REQUIRED = "RECONCILIATION_REQUIRED";

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentTransactionAttemptRepository attemptRepository;
    private final PaymentService paymentService;

    public VnPayReconciliationPersistenceService(
            OrderRepository orderRepository,
            PaymentRepository paymentRepository,
            PaymentTransactionAttemptRepository attemptRepository,
            PaymentService paymentService) {
        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
        this.attemptRepository = attemptRepository;
        this.paymentService = paymentService;
    }

    @Transactional
    public VnPayPaymentStatusResponse recordVerifiedSuccess(
            String transactionReference,
            String transactionNo,
            String bankCode) {
        PaymentTransactionAttempt located = attemptRepository.findByTxnRef(transactionReference)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giao dịch"));
        Long orderId = located.getPayment().getOrder().getId();
        Order order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giao dịch"));
        Payment payment = paymentRepository.findByOrder_IdForUpdate(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giao dịch"));
        PaymentTransactionAttempt attempt = attemptRepository
                .findByTxnRefForUpdate(transactionReference)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giao dịch"));

        if (!attempt.getPayment().getId().equals(payment.getId())
                || !"VNPAY".equalsIgnoreCase(payment.getPaymentMethod())) {
            throw new ResourceNotFoundException("Không tìm thấy giao dịch");
        }
        if ("SUCCESS".equalsIgnoreCase(attempt.getStatus())
                && "SUCCESS".equalsIgnoreCase(payment.getStatus())) {
            return toResponse(order, payment, attempt);
        }

        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        attempt.setResponseCode("00");
        attempt.setTransactionStatus("00");
        attempt.setProviderTransactionNo(transactionNo);
        attempt.setBankCode(bankCode);
        attempt.setCompletedAt(now);
        attempt.setUpdatedAt(now);

        if (!"PENDING".equalsIgnoreCase(attempt.getStatus())
                || !"PENDING".equalsIgnoreCase(payment.getStatus())
                || !"PENDING".equalsIgnoreCase(order.getStatus())) {
            attempt.setStatus(RECONCILIATION_REQUIRED);
            attemptRepository.save(attempt);
            return toResponse(order, payment, attempt);
        }

        attempt.setStatus("SUCCESS");
        paymentService.completeVnPayPayment(payment, order, transactionNo);
        attemptRepository.save(attempt);
        return toResponse(order, payment, attempt);
    }

    private VnPayPaymentStatusResponse toResponse(
            Order order,
            Payment payment,
            PaymentTransactionAttempt attempt) {
        return new VnPayPaymentStatusResponse(
                order.getId(),
                order.getStatus(),
                payment.getStatus(),
                payment.getPaidAt(),
                attempt.getStatus(),
                attempt.getUpdatedAt()
        );
    }
}
