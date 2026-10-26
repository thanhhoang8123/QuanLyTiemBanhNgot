package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.dto.payment.VnPayPaymentStatusResponse;
import com.nhom4.QuanLyTiemBanhNgot.entity.Customer;
import com.nhom4.QuanLyTiemBanhNgot.entity.PaymentTransactionAttempt;
import com.nhom4.QuanLyTiemBanhNgot.exception.ResourceNotFoundException;
import com.nhom4.QuanLyTiemBanhNgot.repository.PaymentTransactionAttemptRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CustomerVnPayStatusService {

    private final AuthenticatedCustomerResolver customerResolver;
    private final PaymentTransactionAttemptRepository attemptRepository;

    public CustomerVnPayStatusService(
            AuthenticatedCustomerResolver customerResolver,
            PaymentTransactionAttemptRepository attemptRepository) {
        this.customerResolver = customerResolver;
        this.attemptRepository = attemptRepository;
    }

    @Transactional(readOnly = true)
    public VnPayPaymentStatusResponse getStatus(String username, String transactionReference) {
        Customer customer = customerResolver.requireActiveCustomer(username);
        if (transactionReference == null
                || !transactionReference.matches("[A-Za-z0-9]{1,100}")) {
            throw new ResourceNotFoundException("Không tìm thấy giao dịch");
        }

        PaymentTransactionAttempt attempt = attemptRepository
                .findByTxnRefAndCustomerId(transactionReference, customer.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giao dịch"));

        return new VnPayPaymentStatusResponse(
                attempt.getPayment().getOrder().getId(),
                attempt.getPayment().getOrder().getStatus(),
                attempt.getPayment().getStatus(),
                attempt.getPayment().getPaidAt(),
                attempt.getStatus(),
                attempt.getUpdatedAt()
        );
    }

    @Transactional(readOnly = true)
    public VnPayPaymentStatusResponse getLatestStatusByOrderId(String username, Long orderId) {
        Customer customer = customerResolver.requireActiveCustomer(username);
        if (orderId == null || orderId <= 0) {
            throw new ResourceNotFoundException("Không tìm thấy giao dịch");
        }

        List<PaymentTransactionAttempt> attempts =
                attemptRepository.findByOrderIdAndCustomerId(
                        orderId,
                        customer.getId(),
                        PageRequest.of(0, 1)
                );
        PaymentTransactionAttempt attempt = attempts.stream()
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giao dịch"));

        return new VnPayPaymentStatusResponse(
                attempt.getPayment().getOrder().getId(),
                attempt.getPayment().getOrder().getStatus(),
                attempt.getPayment().getStatus(),
                attempt.getPayment().getPaidAt(),
                attempt.getStatus(),
                attempt.getUpdatedAt()
        );
    }
}
