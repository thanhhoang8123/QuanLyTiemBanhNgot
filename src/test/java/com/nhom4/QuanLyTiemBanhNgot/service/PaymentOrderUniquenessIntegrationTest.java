package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.dto.payment.CreatePaymentRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.payment.PaymentResponse;
import com.nhom4.QuanLyTiemBanhNgot.dto.payment.SimulatePaymentRequest;
import com.nhom4.QuanLyTiemBanhNgot.exception.ConflictException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class PaymentOrderUniquenessIntegrationTest {

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void concurrentRequestsCannotCreateTwoPaymentsForOneOrder() throws Exception {
        Long customerId = jdbcTemplate.queryForObject(
                "SELECT id FROM customers ORDER BY id LIMIT 1",
                Long.class
        );
        Long employeeId = jdbcTemplate.queryForObject(
                "SELECT id FROM employees ORDER BY id LIMIT 1",
                Long.class
        );
        long orderId = createTemporaryOrder(customerId, employeeId);
        var executor = Executors.newFixedThreadPool(2);
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);

        try {
            var first = executor.submit(() -> tryCreatePayment(orderId, ready, start));
            var second = executor.submit(() -> tryCreatePayment(orderId, ready, start));

            assertTrue(ready.await(10, TimeUnit.SECONDS));
            start.countDown();

            int successfulRequests = (first.get(20, TimeUnit.SECONDS) ? 1 : 0)
                    + (second.get(20, TimeUnit.SECONDS) ? 1 : 0);
            assertEquals(1, successfulRequests);

            Integer paymentCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM payments WHERE order_id = ?",
                    Integer.class,
                    orderId
            );
            assertEquals(1, paymentCount);
        } finally {
            start.countDown();
            executor.shutdownNow();
            executor.awaitTermination(10, TimeUnit.SECONDS);
            jdbcTemplate.update("DELETE FROM payments WHERE order_id = ?", orderId);
            jdbcTemplate.update("DELETE FROM orders WHERE id = ?", orderId);
        }
    }

    @Test
    void simulationUpdatesPaymentAndOrderAtomically() throws Exception {
        Long customerId = jdbcTemplate.queryForObject(
                "SELECT id FROM customers ORDER BY id LIMIT 1",
                Long.class
        );
        Long employeeId = jdbcTemplate.queryForObject(
                "SELECT id FROM employees ORDER BY id LIMIT 1",
                Long.class
        );
        long orderId = createTemporaryOrder(customerId, employeeId);
        PaymentResponse payment = paymentService.create(
                new CreatePaymentRequest(orderId, "CARD")
        );

        try {
            PaymentResponse failed = paymentService.simulate(
                    payment.id(),
                    new SimulatePaymentRequest("FAILED")
            );
            assertEquals("FAILED", failed.status());
            assertNull(failed.paidAt());
            assertEquals(
                    "PENDING",
                    jdbcTemplate.queryForObject(
                            "SELECT status FROM orders WHERE id = ?",
                            String.class,
                            orderId
                    )
            );

            PaymentResponse succeeded = paymentService.simulate(
                    payment.id(),
                    new SimulatePaymentRequest("SUCCESS")
            );
            assertEquals("SUCCESS", succeeded.status());
            assertTrue(succeeded.paidAt() != null);
            assertEquals(
                    "CONFIRMED",
                    jdbcTemplate.queryForObject(
                            "SELECT status FROM orders WHERE id = ?",
                            String.class,
                            orderId
                    )
            );
        } finally {
            jdbcTemplate.update("DELETE FROM payments WHERE order_id = ?", orderId);
            jdbcTemplate.update("DELETE FROM orders WHERE id = ?", orderId);
        }
    }

    @Test
    void concurrentSimulationRequestsKeepPaymentAndOrderConsistent() throws Exception {
        Long customerId = jdbcTemplate.queryForObject(
                "SELECT id FROM customers ORDER BY id LIMIT 1",
                Long.class
        );
        Long employeeId = jdbcTemplate.queryForObject(
                "SELECT id FROM employees ORDER BY id LIMIT 1",
                Long.class
        );
        long orderId = createTemporaryOrder(customerId, employeeId);
        PaymentResponse payment = paymentService.create(
                new CreatePaymentRequest(orderId, "EWALLET")
        );
        var executor = Executors.newFixedThreadPool(2);
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);

        try {
            var first = executor.submit(() -> trySimulate(
                    payment.id(), "SUCCESS", ready, start
            ));
            var second = executor.submit(() -> trySimulate(
                    payment.id(), "FAILED", ready, start
            ));
            assertTrue(ready.await(10, TimeUnit.SECONDS));
            start.countDown();
            first.get(20, TimeUnit.SECONDS);
            second.get(20, TimeUnit.SECONDS);

            assertEquals(
                    "SUCCESS",
                    jdbcTemplate.queryForObject(
                            "SELECT status FROM payments WHERE id = ?",
                            String.class,
                            payment.id()
                    )
            );
            assertEquals(
                    "CONFIRMED",
                    jdbcTemplate.queryForObject(
                            "SELECT status FROM orders WHERE id = ?",
                            String.class,
                            orderId
                    )
            );
            assertEquals(
                    1,
                    jdbcTemplate.queryForObject(
                            "SELECT COUNT(*) FROM payments WHERE id = ? AND paid_at IS NOT NULL",
                            Integer.class,
                            payment.id()
                    )
            );
        } finally {
            start.countDown();
            executor.shutdownNow();
            executor.awaitTermination(10, TimeUnit.SECONDS);
            jdbcTemplate.update("DELETE FROM payments WHERE order_id = ?", orderId);
            jdbcTemplate.update("DELETE FROM orders WHERE id = ?", orderId);
        }
    }

    @Test
    void databaseFailureRollsBackPaymentAndOrderTogether() throws Exception {
        Long customerId = jdbcTemplate.queryForObject(
                "SELECT id FROM customers ORDER BY id LIMIT 1",
                Long.class
        );
        Long employeeId = jdbcTemplate.queryForObject(
                "SELECT id FROM employees ORDER BY id LIMIT 1",
                Long.class
        );
        long orderId = createTemporaryOrder(customerId, employeeId);
        PaymentResponse payment = paymentService.create(
                new CreatePaymentRequest(orderId, "CASH")
        );
        String triggerName = "payment_rollback_" + UUID.randomUUID()
                .toString()
                .replace("-", "");

        try {
            jdbcTemplate.execute("""
                    CREATE TRIGGER %s BEFORE UPDATE ON orders
                    FOR EACH ROW
                    BEGIN
                        IF NEW.status = 'CONFIRMED' THEN
                            SIGNAL SQLSTATE '45000'
                            SET MESSAGE_TEXT = 'forced rollback test failure';
                        END IF;
                    END
                    """.formatted(triggerName));

            org.junit.jupiter.api.Assertions.assertThrows(
                    RuntimeException.class,
                    () -> paymentService.simulate(
                            payment.id(),
                            new SimulatePaymentRequest("SUCCESS")
                    )
            );

            assertEquals(
                    "PENDING",
                    jdbcTemplate.queryForObject(
                            "SELECT status FROM payments WHERE id = ?",
                            String.class,
                            payment.id()
                    )
            );
            assertEquals(
                    1,
                    jdbcTemplate.queryForObject(
                            "SELECT COUNT(*) FROM payments WHERE id = ? AND paid_at IS NULL",
                            Integer.class,
                            payment.id()
                    )
            );
            assertEquals(
                    "PENDING",
                    jdbcTemplate.queryForObject(
                            "SELECT status FROM orders WHERE id = ?",
                            String.class,
                            orderId
                    )
            );
        } finally {
            jdbcTemplate.execute("DROP TRIGGER IF EXISTS " + triggerName);
            jdbcTemplate.update("DELETE FROM payments WHERE order_id = ?", orderId);
            jdbcTemplate.update("DELETE FROM orders WHERE id = ?", orderId);
        }
    }

    private long createTemporaryOrder(Long customerId, Long employeeId) {
        String orderCode = "IT" + UUID.randomUUID().toString().replace("-", "").substring(0, 28);
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(
                    """
                    INSERT INTO orders
                        (order_code, customer_id, employee_id, total_amount, discount_amount, status)
                    VALUES (?, ?, ?, 120.00, 20.00, 'PENDING')
                    """,
                    Statement.RETURN_GENERATED_KEYS
            );
            statement.setString(1, orderCode);
            statement.setLong(2, customerId);
            statement.setLong(3, employeeId);
            return statement;
        }, keyHolder);
        return keyHolder.getKey().longValue();
    }

    private boolean trySimulate(
            long paymentId,
            String result,
            CountDownLatch ready,
            CountDownLatch start) throws InterruptedException {
        ready.countDown();
        if (!start.await(10, TimeUnit.SECONDS)) {
            throw new IllegalStateException("Timed out waiting to start simulation request");
        }

        try {
            paymentService.simulate(paymentId, new SimulatePaymentRequest(result));
            return true;
        } catch (ConflictException expectedConflict) {
            return false;
        }
    }

    private boolean tryCreatePayment(
            long orderId,
            CountDownLatch ready,
            CountDownLatch start) throws InterruptedException {
        ready.countDown();
        if (!start.await(10, TimeUnit.SECONDS)) {
            throw new IllegalStateException("Timed out waiting to start payment request");
        }

        try {
            paymentService.create(new CreatePaymentRequest(orderId, "CASH"));
            return true;
        } catch (ConflictException expectedConflict) {
            return false;
        }
    }
}
