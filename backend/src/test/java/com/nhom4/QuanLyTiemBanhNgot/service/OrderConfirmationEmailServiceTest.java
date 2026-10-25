package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.entity.Customer;
import com.nhom4.QuanLyTiemBanhNgot.entity.Order;
import com.nhom4.QuanLyTiemBanhNgot.entity.OrderItem;
import com.nhom4.QuanLyTiemBanhNgot.entity.Product;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.AbstractPlatformTransactionManager;
import org.springframework.transaction.support.DefaultTransactionStatus;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

class OrderConfirmationEmailServiceTest {
    private JavaMailSender mailSender;
    private OrderConfirmationEmailService service;
    private TestTransactionManager transactionManager;
    private TransactionTemplate transactionTemplate;

    @BeforeEach
    void setUp() {
        mailSender = mock(JavaMailSender.class);
        service = new OrderConfirmationEmailService(new AfterCommitEmailSender(mailSender));
        transactionManager = new TestTransactionManager();
        transactionTemplate = new TransactionTemplate(transactionManager);
    }

    @Test
    void sendsOneConfirmationAfterCommitWithOrderDetails() {
        Order order = orderWithCustomerEmail("customer@example.com");
        OrderItem item = orderItem("Bánh kem", 2);
        doAnswer(invocation -> {
            assertTrue(transactionManager.committed);
            return null;
        }).when(mailSender).send(any(SimpleMailMessage.class));

        transactionTemplate.executeWithoutResult(
                status -> service.sendOrderConfirmation(order, List.of(item)));

        var messageCaptor = org.mockito.ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(messageCaptor.capture());
        SimpleMailMessage message = messageCaptor.getValue();
        assertEquals("customer@example.com", message.getTo()[0]);
        assertTrue(message.getText().contains("DH000123"));
        assertTrue(message.getText().contains("24/10/2026 18:30"));
        assertTrue(message.getText().contains("Bánh kem x 2"));
        assertTrue(message.getText().contains("Địa chỉ nhận hàng: 12 Đường Hoa"));
        assertTrue(message.getText().contains("135.000 VND"));
        assertTrue(message.getText().contains("đã được tiếp nhận thành công"));
        assertTrue(message.getText().contains("không phải xác nhận thanh toán"));
    }

    @Test
    void doesNotSendWhenTransactionRollsBack() {
        Order order = orderWithCustomerEmail("customer@example.com");

        transactionTemplate.executeWithoutResult(status -> {
            service.sendOrderConfirmation(order, List.of(orderItem("Bánh kem", 1)));
            status.setRollbackOnly();
        });

        verify(mailSender, never()).send(any(SimpleMailMessage.class));
    }

    @Test
    void smtpFailureDoesNotEscapeAfterCommit() {
        Order order = orderWithCustomerEmail("customer@example.com");
        doThrow(new MailSendException("test failure"))
                .when(mailSender).send(any(SimpleMailMessage.class));

        transactionTemplate.executeWithoutResult(
                status -> service.sendOrderConfirmation(order, List.of(orderItem("Bánh kem", 1))));

        assertTrue(transactionManager.committed);
        verify(mailSender).send(any(SimpleMailMessage.class));
    }

    @Test
    void skipsMissingOrInvalidCustomerEmail() {
        Order noEmail = orderWithCustomerEmail(" ");
        Order invalidEmail = orderWithCustomerEmail("not-an-email");

        transactionTemplate.executeWithoutResult(status -> {
            service.sendOrderConfirmation(noEmail, List.of());
            service.sendOrderConfirmation(invalidEmail, List.of());
        });

        verifyNoInteractions(mailSender);
    }

    @Test
    void omitsAddressWhenNotProvided() {
        Order order = orderWithCustomerEmail("customer@example.com");
        order.setDeliveryAddress(" ");

        transactionTemplate.executeWithoutResult(
                status -> service.sendOrderConfirmation(order, List.of(orderItem("Croissant", 1))));

        var messageCaptor = org.mockito.ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(messageCaptor.capture());
        assertTrue(!messageCaptor.getValue().getText().contains("Địa chỉ nhận hàng:"));
    }

    @Test
    void refusesToScheduleWithoutAnActiveTransaction() {
        assertThrows(IllegalStateException.class, () -> service.sendOrderConfirmation(
                orderWithCustomerEmail("customer@example.com"),
                List.of(orderItem("Bánh kem", 1))));

        verifyNoInteractions(mailSender);
    }

    private Order orderWithCustomerEmail(String email) {
        Customer customer = new Customer();
        customer.setEmail(email);

        Order order = new Order();
        order.setOrderCode("DH000123");
        order.setCustomer(customer);
        order.setOrderDate(LocalDateTime.of(2026, 10, 24, 18, 30));
        order.setDeliveryAddress("12 Đường Hoa");
        order.setTotalAmount(new BigDecimal("150000.00"));
        order.setDiscountAmount(new BigDecimal("15000.00"));
        return order;
    }

    private OrderItem orderItem(String productName, int quantity) {
        Product product = new Product();
        product.setName(productName);

        OrderItem item = new OrderItem();
        item.setProduct(product);
        item.setQuantity(quantity);
        return item;
    }

    private static final class TestTransactionManager extends AbstractPlatformTransactionManager {
        private boolean committed;

        @Override
        protected Object doGetTransaction() {
            return new Object();
        }

        @Override
        protected void doBegin(Object transaction, TransactionDefinition definition) {
            committed = false;
        }

        @Override
        protected void doCommit(DefaultTransactionStatus status) {
            committed = true;
        }

        @Override
        protected void doRollback(DefaultTransactionStatus status) {
        }
    }
}
