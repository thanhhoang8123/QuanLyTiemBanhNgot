package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.config.VnPayProperties;
import com.nhom4.QuanLyTiemBanhNgot.dto.payment.VnPayPaymentStatusResponse;
import com.nhom4.QuanLyTiemBanhNgot.dto.payment.VnPayReconciliationResponse;
import com.nhom4.QuanLyTiemBanhNgot.entity.Customer;
import com.nhom4.QuanLyTiemBanhNgot.entity.PaymentTransactionAttempt;
import com.nhom4.QuanLyTiemBanhNgot.repository.PaymentTransactionAttemptRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VnPayReconciliationByOrderTests {
    @Mock
    private VnPayProperties properties;
    @Mock
    private AuthenticatedCustomerResolver customerResolver;
    @Mock
    private PaymentTransactionAttemptRepository attemptRepository;
    @Mock
    private VnPaySignatureService signatureService;
    @Mock
    private VnPayQueryClient queryClient;
    @Mock
    private VnPayReconciliationPersistenceService persistenceService;
    @Spy
    @InjectMocks
    private VnPayReconciliationService service;

    @Test
    void reconcilesLatestAttemptForTheAuthenticatedCustomersOrder() {
        Customer customer = new Customer();
        customer.setId(42L);
        PaymentTransactionAttempt attempt = new PaymentTransactionAttempt();
        attempt.setTxnRef("latestreference");
        VnPayReconciliationResponse expected = new VnPayReconciliationResponse(
                new VnPayPaymentStatusResponse(7L, "PENDING", "PENDING", null, "PENDING", null),
                "Chưa thể xác nhận giao dịch."
        );
        when(customerResolver.requireActiveCustomer("buyer")).thenReturn(customer);
        when(attemptRepository.findByOrderIdAndCustomerId(
                eq(7L),
                eq(42L),
                any(Pageable.class)
        )).thenReturn(List.of(attempt));
        doReturn(expected).when(service).reconcile("buyer", "latestreference");

        VnPayReconciliationResponse result = service.reconcileLatestByOrderId("buyer", 7L);

        assertSame(expected, result);
        verify(attemptRepository).findByOrderIdAndCustomerId(
                eq(7L),
                eq(42L),
                any(Pageable.class)
        );
        verify(service).reconcile("buyer", "latestreference");
    }
}
