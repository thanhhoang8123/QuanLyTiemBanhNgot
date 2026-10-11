package com.nhom4.QuanLyTiemBanhNgot.mapper;

import com.nhom4.QuanLyTiemBanhNgot.entity.Order;
import com.nhom4.QuanLyTiemBanhNgot.entity.Payment;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PaymentMapperTest {

    private final PaymentMapper paymentMapper = new PaymentMapper();

    @Test
    void mapsPaymentToResponseWithoutEmbeddingOrderEntity() {
        Order order = new Order();
        order.setId(9L);
        order.setOrderCode("DH000009");

        Payment payment = new Payment();
        payment.setId(4L);
        payment.setOrder(order);
        payment.setAmount(new BigDecimal("150.00"));
        payment.setPaymentMethod("CARD");
        payment.setStatus("PENDING");
        payment.setTransactionId("tx-123");
        payment.setProvider("provider");

        var response = paymentMapper.toResponse(payment);

        assertEquals(9L, response.orderId());
        assertEquals(new BigDecimal("150.00"), response.amount());
        String[] fields = java.util.Arrays.stream(
                        response.getClass().getRecordComponents())
                .map(component -> component.getName())
                .toArray(String[]::new);
        assertTrue(java.util.Arrays.asList(fields).contains("orderId"));
        assertFalse(java.util.Arrays.asList(fields).contains("order"));
    }
}
