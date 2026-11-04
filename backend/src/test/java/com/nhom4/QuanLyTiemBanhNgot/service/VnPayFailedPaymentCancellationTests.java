package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.config.VnPayProperties;
import com.nhom4.QuanLyTiemBanhNgot.dto.payment.VnPayIpnResponse;
import com.nhom4.QuanLyTiemBanhNgot.entity.Order;
import com.nhom4.QuanLyTiemBanhNgot.entity.Payment;
import com.nhom4.QuanLyTiemBanhNgot.entity.PaymentTransactionAttempt;
import com.nhom4.QuanLyTiemBanhNgot.repository.OrderRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.PaymentRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.PaymentTransactionAttemptRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VnPayFailedPaymentCancellationTests {

    @Mock private VnPaySignatureService signatureService;
    @Mock private PaymentTransactionAttemptRepository attemptRepository;
    @Mock private OrderRepository orderRepository;
    @Mock private PaymentRepository paymentRepository;
    @Mock private PaymentService paymentService;
    @Mock private OrderService orderService;

    private VnPayIpnService ipnService;
    private Order order;
    private Payment payment;
    private PaymentTransactionAttempt attempt;

    @BeforeEach
    void setUp() {
        VnPayProperties properties = new VnPayProperties();
        properties.setTmnCode("TEST01");
        ipnService = new VnPayIpnService(
                properties,
                signatureService,
                attemptRepository,
                orderRepository,
                paymentRepository,
                paymentService,
                orderService
        );

        order = new Order();
        order.setId(42L);
        order.setStatus("PENDING");
        order.setTotalAmount(new BigDecimal("1000"));
        order.setDiscountAmount(BigDecimal.ZERO);

        payment = new Payment();
        payment.setId(10L);
        payment.setOrder(order);
        payment.setPaymentMethod("VNPAY");
        payment.setAmount(new BigDecimal("1000"));
        payment.setStatus("PENDING");

        attempt = new PaymentTransactionAttempt();
        attempt.setPayment(payment);
        attempt.setTxnRef("testtxn");
        attempt.setAmountVnd(1000L);
        attempt.setStatus("PENDING");
    }

    @Test
    void confirmedVnPayFailureCancelsOrder() {
        Map<String, List<String>> parameters = callback("24", "02");
        stubCallback(parameters);

        VnPayIpnResponse response = ipnService.process(parameters);

        verify(attemptRepository).findByTxnRef("testtxn");
        assertEquals("00", response.rspCode(), response.message());
        assertEquals("FAILED", payment.getStatus());
        assertEquals("FAILED", attempt.getStatus());
        verify(attemptRepository).saveAndFlush(attempt);
        verify(orderService).cancel(42L, "Hủy đơn hàng do thanh toán VNPay thất bại");
    }

    @Test
    void ambiguousVnPayResultDoesNotCancelOrder() {
        Map<String, List<String>> parameters = callback("00", "01");
        stubCallback(parameters);

        VnPayIpnResponse response = ipnService.process(parameters);

        verify(attemptRepository).findByTxnRef("testtxn");
        assertEquals("00", response.rspCode(), response.message());
        assertEquals("PENDING", payment.getStatus());
        assertEquals("RECONCILIATION_REQUIRED", attempt.getStatus());
        verify(orderService, never()).cancel(42L, "Hủy đơn hàng do thanh toán VNPay thất bại");
    }

    private Map<String, List<String>> callback(String responseCode, String transactionStatus) {
        return Map.of(
                "vnp_TmnCode", List.of("TEST01"),
                "vnp_Amount", List.of("100000"),
                "vnp_BankCode", List.of("NCB"),
                "vnp_OrderInfo", List.of("Thanh toan don hang 42"),
                "vnp_TransactionNo", List.of("12345"),
                "vnp_ResponseCode", List.of(responseCode),
                "vnp_TransactionStatus", List.of(transactionStatus),
                "vnp_TxnRef", List.of("testtxn"),
                "vnp_SecureHash", List.of("valid-signature")
        );
    }

    private void stubCallback(Map<String, List<String>> parameters) {
        when(signatureService.hasValidCallbackSignature(parameters)).thenReturn(true);
        when(attemptRepository.findByTxnRef("testtxn")).thenReturn(Optional.of(attempt));
        when(orderRepository.findByIdForUpdate(42L)).thenReturn(Optional.of(order));
        when(paymentRepository.findByOrder_IdForUpdate(42L)).thenReturn(Optional.of(payment));
        when(attemptRepository.findByTxnRefForUpdate("testtxn"))
                .thenReturn(Optional.of(attempt));
    }
}
