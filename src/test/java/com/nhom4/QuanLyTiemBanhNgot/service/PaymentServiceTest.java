package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.dto.payment.CreatePaymentRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.payment.PaymentResponse;
import com.nhom4.QuanLyTiemBanhNgot.dto.payment.SimulatePaymentRequest;
import com.nhom4.QuanLyTiemBanhNgot.exception.ConflictException;
import com.nhom4.QuanLyTiemBanhNgot.entity.Order;
import com.nhom4.QuanLyTiemBanhNgot.entity.Payment;
import com.nhom4.QuanLyTiemBanhNgot.exception.ResourceNotFoundException;
import com.nhom4.QuanLyTiemBanhNgot.mapper.PaymentMapper;
import com.nhom4.QuanLyTiemBanhNgot.repository.OrderRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.PaymentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private OrderRepository orderRepository;

    private PaymentService paymentService;

    @BeforeEach
    void setUp() {
        paymentService = new PaymentService(
                paymentRepository,
                orderRepository,
                new PaymentMapper()
        );
    }

    @Test
    void findByIdMapsPaymentToResponseWhenItExists() {
        Payment payment = new Payment();
        payment.setId(5L);
        payment.setAmount(new BigDecimal("120.00"));
        when(paymentRepository.findById(5L)).thenReturn(Optional.of(payment));

        PaymentResponse response = paymentService.findById(5L);

        assertEquals(5L, response.id());
        assertEquals(new BigDecimal("120.00"), response.amount());
    }

    @Test
    void findByIdThrowsNotFoundWhenPaymentDoesNotExist() {
        when(paymentRepository.findById(5L)).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> paymentService.findById(5L)
        );

        assertEquals("Không tìm thấy thanh toán với ID: 5", exception.getMessage());
    }

    @Test
    void updateRejectsExistingPaymentWithoutChangingIt() {
        Payment payment = new Payment();
        payment.setId(5L);
        payment.setStatus("PENDING");
        payment.setPaymentMethod("CASH");
        when(paymentRepository.findById(5L)).thenReturn(Optional.of(payment));

        assertThrows(ConflictException.class, () -> paymentService.update(5L));

        assertEquals("PENDING", payment.getStatus());
        assertEquals("CASH", payment.getPaymentMethod());
        verify(paymentRepository, never()).save(any(Payment.class));
    }

    @Test
    void updateThrowsNotFoundWhenPaymentDoesNotExist() {
        when(paymentRepository.findById(5L)).thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> paymentService.update(5L)
        );

        verify(paymentRepository, never()).save(any(Payment.class));
    }

    @Test
    void deleteRemovesPendingPayment() {
        Payment payment = new Payment();
        payment.setId(5L);
        payment.setStatus("PENDING");
        when(paymentRepository.findById(5L)).thenReturn(Optional.of(payment));

        paymentService.deleteById(5L);

        verify(paymentRepository).delete(payment);
    }

    @Test
    void deleteThrowsNotFoundAndDoesNotDeleteWhenPaymentDoesNotExist() {
        when(paymentRepository.findById(5L)).thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> paymentService.deleteById(5L)
        );

        verify(paymentRepository, never()).delete(any(Payment.class));
    }

    @Test
    void deleteRejectsSuccessfulPayment() {
        Payment payment = new Payment();
        payment.setId(5L);
        payment.setStatus("SUCCESS");
        when(paymentRepository.findById(5L)).thenReturn(Optional.of(payment));

        assertThrows(
                ConflictException.class,
                () -> paymentService.deleteById(5L)
        );

        verify(paymentRepository, never()).delete(any(Payment.class));
    }

    @Test
    void findAllMapsPaymentsToResponses() {
        Payment payment = new Payment();
        payment.setId(5L);
        when(paymentRepository.findAll()).thenReturn(List.of(payment));

        List<PaymentResponse> response = paymentService.findAll();

        assertEquals(1, response.size());
        assertEquals(5L, response.getFirst().id());
    }

    @Test
    void saveKeepsExistingInternalBehavior() {
        Payment payment = new Payment();
        when(paymentRepository.save(payment)).thenReturn(payment);

        assertSame(payment, paymentService.save(payment));
        verify(paymentRepository).save(payment);
    }

    @Test
    void createLinksExistingOrderAndDoesNotInventBackendControlledFields() {
        Order order = new Order();
        order.setId(8L);
        order.setTotalAmount(new BigDecimal("120.00"));
        order.setDiscountAmount(new BigDecimal("40.00"));
        when(orderRepository.findById(8L)).thenReturn(Optional.of(order));
        when(paymentRepository.existsByOrder_Id(8L)).thenReturn(false);
        when(paymentRepository.saveAndFlush(any(Payment.class)))
                .thenAnswer(invocation -> {
                    Payment payment = invocation.getArgument(0);
                    payment.setId(12L);
                    return payment;
                });

        PaymentResponse response = paymentService.create(
                new CreatePaymentRequest(8L, "CASH")
        );

        assertEquals(12L, response.id());
        assertEquals(8L, response.orderId());
        assertEquals("CASH", response.paymentMethod());
        assertEquals(new BigDecimal("80.00"), response.amount());
        assertEquals("PENDING", response.status());
        assertNull(response.transactionId());
        assertNull(response.provider());
        assertNull(response.paidAt());
    }

    @Test
    void createReturnsNotFoundWhenReferencedOrderDoesNotExist() {
        when(orderRepository.findById(8L)).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> paymentService.create(new CreatePaymentRequest(8L, "CARD"))
        );

        assertEquals("Không tìm thấy đơn hàng với ID: 8", exception.getMessage());
        verify(paymentRepository, never()).save(any(Payment.class));
    }

    @Test
    void createRejectsOrderThatAlreadyHasPayment() {
        Order order = new Order();
        order.setId(8L);
        order.setTotalAmount(new BigDecimal("100.00"));
        order.setDiscountAmount(BigDecimal.ZERO);
        when(orderRepository.findById(8L)).thenReturn(Optional.of(order));
        when(paymentRepository.existsByOrder_Id(8L)).thenReturn(true);

        assertThrows(
                ConflictException.class,
                () -> paymentService.create(new CreatePaymentRequest(8L, "CASH"))
        );
        verify(paymentRepository, never()).saveAndFlush(any(Payment.class));
    }

    @Test
    void createRejectsNonPositiveAmount() {
        Order order = new Order();
        order.setId(8L);
        order.setTotalAmount(new BigDecimal("100.00"));
        order.setDiscountAmount(new BigDecimal("100.00"));
        when(orderRepository.findById(8L)).thenReturn(Optional.of(order));
        when(paymentRepository.existsByOrder_Id(8L)).thenReturn(false);

        assertThrows(
                ConflictException.class,
                () -> paymentService.create(new CreatePaymentRequest(8L, "CASH"))
        );
        verify(paymentRepository, never()).saveAndFlush(any(Payment.class));
    }

    @Test
    void simulateSuccessConfirmsPendingOrderAndSetsPaidAt() {
        Payment payment = paymentForSimulation("PENDING", "PENDING");
        when(paymentRepository.findByIdForUpdate(5L)).thenReturn(Optional.of(payment));
        when(orderRepository.findByIdForUpdate(8L))
                .thenReturn(Optional.of(payment.getOrder()));
        when(paymentRepository.save(payment)).thenReturn(payment);

        PaymentResponse response = paymentService.simulate(
                5L,
                new SimulatePaymentRequest("SUCCESS")
        );

        assertEquals("SUCCESS", response.status());
        assertEquals("CONFIRMED", payment.getOrder().getStatus());
        org.junit.jupiter.api.Assertions.assertNotNull(response.paidAt());
        verify(orderRepository).save(payment.getOrder());
    }

    @Test
    void simulateFailureKeepsOrderPendingAndPaidAtNull() {
        Payment payment = paymentForSimulation("PENDING", "PENDING");
        when(paymentRepository.findByIdForUpdate(5L)).thenReturn(Optional.of(payment));
        when(orderRepository.findByIdForUpdate(8L))
                .thenReturn(Optional.of(payment.getOrder()));
        when(paymentRepository.save(payment)).thenReturn(payment);

        PaymentResponse response = paymentService.simulate(
                5L,
                new SimulatePaymentRequest("FAILED")
        );

        assertEquals("FAILED", response.status());
        assertNull(response.paidAt());
        assertEquals("PENDING", payment.getOrder().getStatus());
        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    void failedPaymentCanBeRetriedOnTheSamePayment() {
        Payment payment = paymentForSimulation("FAILED", "PENDING");
        when(paymentRepository.findByIdForUpdate(5L)).thenReturn(Optional.of(payment));
        when(orderRepository.findByIdForUpdate(8L))
                .thenReturn(Optional.of(payment.getOrder()));
        when(paymentRepository.save(payment)).thenReturn(payment);

        PaymentResponse response = paymentService.simulate(
                5L,
                new SimulatePaymentRequest("SUCCESS")
        );

        assertEquals(5L, response.id());
        assertEquals("SUCCESS", response.status());
        assertEquals("CONFIRMED", payment.getOrder().getStatus());
    }

    @Test
    void successfulPaymentCannotBeProcessedAgain() {
        Payment payment = paymentForSimulation("SUCCESS", "CONFIRMED");
        when(paymentRepository.findByIdForUpdate(5L)).thenReturn(Optional.of(payment));
        when(orderRepository.findByIdForUpdate(8L))
                .thenReturn(Optional.of(payment.getOrder()));

        assertThrows(
                ConflictException.class,
                () -> paymentService.simulate(5L, new SimulatePaymentRequest("FAILED"))
        );
        verify(paymentRepository, never()).save(any(Payment.class));
    }

    @Test
    void cancelledOrderCannotBePaid() {
        Payment payment = paymentForSimulation("PENDING", "CANCELLED");
        when(paymentRepository.findByIdForUpdate(5L)).thenReturn(Optional.of(payment));
        when(orderRepository.findByIdForUpdate(8L))
                .thenReturn(Optional.of(payment.getOrder()));

        assertThrows(
                ConflictException.class,
                () -> paymentService.simulate(5L, new SimulatePaymentRequest("SUCCESS"))
        );
        verify(paymentRepository, never()).save(any(Payment.class));
    }

    @Test
    void completedOrderCannotBePaid() {
        Payment payment = paymentForSimulation("PENDING", "COMPLETED");
        when(paymentRepository.findByIdForUpdate(5L)).thenReturn(Optional.of(payment));
        when(orderRepository.findByIdForUpdate(8L))
                .thenReturn(Optional.of(payment.getOrder()));

        assertThrows(
                ConflictException.class,
                () -> paymentService.simulate(5L, new SimulatePaymentRequest("SUCCESS"))
        );
        verify(paymentRepository, never()).save(any(Payment.class));
    }

    @Test
    void simulateReturnsNotFoundForMissingPayment() {
        when(paymentRepository.findByIdForUpdate(5L)).thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> paymentService.simulate(5L, new SimulatePaymentRequest("SUCCESS"))
        );
    }

    private Payment paymentForSimulation(String paymentStatus, String orderStatus) {
        Order order = new Order();
        order.setId(8L);
        order.setStatus(orderStatus);

        Payment payment = new Payment();
        payment.setId(5L);
        payment.setOrder(order);
        payment.setStatus(paymentStatus);
        payment.setPaidAt(null);
        return payment;
    }
}
