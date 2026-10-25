package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.dto.payment.SimulatePaymentRequest;
import com.nhom4.QuanLyTiemBanhNgot.entity.Customer;
import com.nhom4.QuanLyTiemBanhNgot.entity.Order;
import com.nhom4.QuanLyTiemBanhNgot.entity.Payment;
import com.nhom4.QuanLyTiemBanhNgot.exception.ConflictException;
import com.nhom4.QuanLyTiemBanhNgot.mapper.PaymentMapper;
import com.nhom4.QuanLyTiemBanhNgot.repository.CustomerRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.OrderRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.PaymentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PaymentServiceLoyaltyPointsTest {
    private PaymentRepository paymentRepository;
    private OrderRepository orderRepository;
    private CustomerRepository customerRepository;
    private PaymentService service;

    @BeforeEach
    void setUp() {
        paymentRepository = mock(PaymentRepository.class);
        orderRepository = mock(OrderRepository.class);
        customerRepository = mock(CustomerRepository.class);
        service = new PaymentService(
                paymentRepository,
                orderRepository,
                customerRepository,
                new PaymentMapper(),
                mock(OrderStatusHistoryService.class)
        );
    }

    @Test
    void successfulPaymentAwardsOnePointPerFullTenThousandDong() {
        Customer customer = customer(11L, "customer@example.com", 8);
        Payment payment = payment(12L, 21L, customer, "PENDING", "25000");
        stubPaymentLocks(payment);
        when(customerRepository.findByIdForUpdate(11L)).thenReturn(Optional.of(customer));
        when(paymentRepository.save(payment)).thenReturn(payment);

        service.simulate(12L, new SimulatePaymentRequest("SUCCESS"));

        assertEquals(10, customer.getLoyaltyPoints());
        verify(customerRepository).save(customer);
    }

    @Test
    void walkInCustomerDoesNotEarnPoints() {
        Customer walkIn = customer(13L, "pos.walkin@example.invalid", 0);
        Payment payment = payment(14L, 22L, walkIn, "PENDING", "35000");
        stubPaymentLocks(payment);
        when(paymentRepository.save(payment)).thenReturn(payment);

        service.simulate(14L, new SimulatePaymentRequest("SUCCESS"));

        assertEquals(0, walkIn.getLoyaltyPoints());
        verify(customerRepository, never()).findByIdForUpdate(13L);
        verify(customerRepository, never()).save(walkIn);
    }

    @Test
    void failedPaymentDoesNotEarnPoints() {
        Customer customer = customer(15L, "customer@example.com", 3);
        Payment payment = payment(16L, 23L, customer, "PENDING", "30000");
        stubPaymentLocks(payment);
        when(paymentRepository.save(payment)).thenReturn(payment);

        service.simulate(16L, new SimulatePaymentRequest("FAILED"));

        assertEquals(3, customer.getLoyaltyPoints());
        verify(customerRepository, never()).findByIdForUpdate(15L);
    }

    @Test
    void successfulPaymentCannotBeRetriedToAwardPointsAgain() {
        Customer customer = customer(17L, "customer@example.com", 4);
        Payment payment = payment(18L, 24L, customer, "SUCCESS", "30000");
        stubPaymentLocks(payment);

        assertThrows(
                ConflictException.class,
                () -> service.simulate(18L, new SimulatePaymentRequest("SUCCESS"))
        );

        assertEquals(4, customer.getLoyaltyPoints());
        verify(customerRepository, never()).findByIdForUpdate(17L);
    }

    private void stubPaymentLocks(Payment payment) {
        when(paymentRepository.findById(payment.getId())).thenReturn(Optional.of(payment));
        when(orderRepository.findByIdForUpdate(payment.getOrder().getId()))
                .thenReturn(Optional.of(payment.getOrder()));
        when(paymentRepository.findByIdForUpdate(payment.getId()))
                .thenReturn(Optional.of(payment));
    }

    private Customer customer(Long id, String email, int points) {
        Customer customer = new Customer();
        customer.setId(id);
        customer.setEmail(email);
        customer.setLoyaltyPoints(points);
        return customer;
    }

    private Payment payment(
            Long id,
            Long orderId,
            Customer customer,
            String status,
            String amount) {
        Order order = new Order();
        order.setId(orderId);
        order.setStatus("PENDING");
        order.setCustomer(customer);

        Payment payment = new Payment();
        payment.setId(id);
        payment.setOrder(order);
        payment.setStatus(status);
        payment.setAmount(new BigDecimal(amount));
        return payment;
    }
}
