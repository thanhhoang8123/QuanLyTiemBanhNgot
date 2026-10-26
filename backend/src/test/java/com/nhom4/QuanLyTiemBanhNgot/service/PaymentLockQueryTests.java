package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.repository.OrderRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.PaymentRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@Transactional
class PaymentLockQueryTests {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Test
    void paymentAndOrderLockQueriesExecuteAgainstMariaDbWithoutChangingData() {
        Long nonexistentId = Long.MIN_VALUE;

        assertTrue(orderRepository.findByIdForUpdate(nonexistentId).isEmpty());
        assertTrue(paymentRepository.findByIdForUpdate(nonexistentId).isEmpty());
        assertTrue(paymentRepository.findByOrder_IdForUpdate(nonexistentId).isEmpty());
    }
}
