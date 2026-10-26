package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.dto.payment.CreatePaymentRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.payment.PaymentResponse;
import com.nhom4.QuanLyTiemBanhNgot.dto.payment.SimulatePaymentRequest;
import com.nhom4.QuanLyTiemBanhNgot.entity.Customer;
import com.nhom4.QuanLyTiemBanhNgot.entity.Order;
import com.nhom4.QuanLyTiemBanhNgot.entity.Payment;
import com.nhom4.QuanLyTiemBanhNgot.exception.ConflictException;
import com.nhom4.QuanLyTiemBanhNgot.mapper.PaymentMapper;
import com.nhom4.QuanLyTiemBanhNgot.repository.CustomerRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.OrderRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.PaymentRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.PaymentTransactionAttemptRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentServiceDiscountTests {

    @Mock private PaymentRepository paymentRepository;
    @Mock private OrderRepository orderRepository;
    @Mock private PaymentTransactionAttemptRepository paymentTransactionAttemptRepository;
    @Mock private CustomerRepository customerRepository;
    @Mock private OrderStatusHistoryService orderStatusHistoryService;
    @Spy private PaymentMapper paymentMapper = new PaymentMapper();

    @InjectMocks
    private PaymentService paymentService;

    @Test
    void paymentAmountIsCalculatedFromPersistedDiscountedOrder() {
        Order order = order(42L, "300000.00", "30000.00");
        when(orderRepository.findByIdForUpdate(42L)).thenReturn(Optional.of(order));
        when(paymentRepository.existsByOrder_Id(42L)).thenReturn(false);
        when(paymentRepository.saveAndFlush(any(Payment.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        PaymentResponse payment = paymentService.create(
                new CreatePaymentRequest(42L, "CASH"));

        assertEquals(new BigDecimal("270000.00"), payment.amount());
        assertEquals(42L, payment.orderId());
        assertEquals("PENDING", payment.status());
    }

    @Test
    void paymentWithoutPromotionUsesFullOrderTotal() {
        Order order = order(43L, "125000.00", "0.00");
        when(orderRepository.findByIdForUpdate(43L)).thenReturn(Optional.of(order));
        when(paymentRepository.existsByOrder_Id(43L)).thenReturn(false);
        when(paymentRepository.saveAndFlush(any(Payment.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        PaymentResponse payment = paymentService.create(
                new CreatePaymentRequest(43L, "CARD"));

        assertEquals(new BigDecimal("125000.00"), payment.amount());
    }

    @Test
    void repeatedPaymentCreationDoesNotInsertAnotherPayment() {
        Order order = order(44L, "100000.00", "10000.00");
        when(orderRepository.findByIdForUpdate(44L)).thenReturn(Optional.of(order));
        when(paymentRepository.existsByOrder_Id(44L)).thenReturn(true);

        assertThrows(
                ConflictException.class,
                () -> paymentService.create(new CreatePaymentRequest(44L, "CASH")));

        verify(paymentRepository, never()).saveAndFlush(any(Payment.class));
    }

    @Test
    void retryAfterFailedPaymentUpdatesTheSamePaymentRecord() {
        Order order = order(45L, "300000.00", "30000.00");
        Payment payment = new Payment();
        payment.setId(12L);
        payment.setOrder(order);
        payment.setAmount(new BigDecimal("270000.00"));
        payment.setPaymentMethod("CASH");
        payment.setStatus("PENDING");
        when(paymentRepository.findById(12L)).thenReturn(Optional.of(payment));
        when(paymentRepository.findByIdForUpdate(12L)).thenReturn(Optional.of(payment));
        when(orderRepository.findByIdForUpdate(45L)).thenReturn(Optional.of(order));
        when(paymentRepository.save(payment)).thenReturn(payment);

        paymentService.simulate(12L, new SimulatePaymentRequest("FAILED"));
        PaymentResponse retriedPayment = paymentService.simulate(
                12L, new SimulatePaymentRequest("SUCCESS"));

        assertEquals(12L, retriedPayment.id());
        assertEquals(new BigDecimal("270000.00"), retriedPayment.amount());
        assertEquals("SUCCESS", retriedPayment.status());
        verify(paymentRepository, never()).saveAndFlush(any(Payment.class));
        verify(paymentRepository, org.mockito.Mockito.times(2)).save(payment);
    }

    @Test
    void pointsAreRedeemedAndAwardedOnlyWhenPaymentSucceeds() {
        Order order = order(46L, "190000.00", "10000.00");
        Customer customer = new Customer();
        customer.setId(9L);
        customer.setEmail("customer@example.test");
        customer.setLoyaltyPoints(20);
        order.setCustomer(customer);
        Payment payment = payment(13L, order, "180000.00");
        when(paymentRepository.findById(13L)).thenReturn(Optional.of(payment));
        when(paymentRepository.findByIdForUpdate(13L)).thenReturn(Optional.of(payment));
        when(orderRepository.findByIdForUpdate(46L)).thenReturn(Optional.of(order));
        when(customerRepository.findByIdForUpdate(9L)).thenReturn(Optional.of(customer));
        when(paymentRepository.save(payment)).thenReturn(payment);

        PaymentResponse result = paymentService.simulate(
                13L, new SimulatePaymentRequest("SUCCESS"));

        assertEquals("SUCCESS", result.status());
        assertEquals(28, customer.getLoyaltyPoints());
        verify(customerRepository).save(customer);
    }

    @Test
    void failedPaymentDoesNotRedeemCustomerPoints() {
        Order order = order(47L, "190000.00", "10000.00");
        Customer customer = new Customer();
        customer.setId(10L);
        customer.setEmail("customer@example.test");
        customer.setLoyaltyPoints(20);
        order.setCustomer(customer);
        Payment payment = payment(14L, order, "180000.00");
        when(paymentRepository.findById(14L)).thenReturn(Optional.of(payment));
        when(paymentRepository.findByIdForUpdate(14L)).thenReturn(Optional.of(payment));
        when(orderRepository.findByIdForUpdate(47L)).thenReturn(Optional.of(order));
        when(paymentRepository.save(payment)).thenReturn(payment);

        paymentService.simulate(14L, new SimulatePaymentRequest("FAILED"));

        assertEquals(20, customer.getLoyaltyPoints());
        verify(customerRepository, never()).findByIdForUpdate(10L);
        verify(customerRepository, never()).save(any());
    }

    private Order order(Long id, String total, String discount) {
        Order order = new Order();
        order.setId(id);
        order.setStatus("PENDING");
        order.setTotalAmount(new BigDecimal(total));
        order.setDiscountAmount(new BigDecimal(discount));
        return order;
    }

    private Payment payment(Long id, Order order, String amount) {
        Payment payment = new Payment();
        payment.setId(id);
        payment.setOrder(order);
        payment.setAmount(new BigDecimal(amount));
        payment.setPaymentMethod("CASH");
        payment.setStatus("PENDING");
        return payment;
    }
}
