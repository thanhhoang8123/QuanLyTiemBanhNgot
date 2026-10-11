package com.nhom4.QuanLyTiemBanhNgot.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entity đại diện cho bảng payments.
 *
 * Bảng này lưu thông tin thanh toán của đơn hàng.
 *
 * Quan hệ:
 * Order 1 ----- N Payment
 */
@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Payment {

    /**
     * Khóa chính.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Đơn hàng được thanh toán.
     *
     * order_id → orders.id
     */
    @ManyToOne
    @JoinColumn(name = "order_id")
    private Order order;

    /**
     * Phương thức thanh toán.
     *
     * Theo ERD:
     * CASH
     * CARD
     * EWALLET
     */
    @Column(name = "payment_method", length = 30)
    private String paymentMethod;

    /**
     * Số tiền thanh toán.
     */
    @Column(precision = 15, scale = 2)
    private BigDecimal amount;

    /**
     * Trạng thái thanh toán.
     *
     * Theo ERD:
     * PENDING
     * SUCCESS
     * FAILED
     */
    @Column(length = 30)
    private String status;

    /**
     * Mã giao dịch.
     *
     * Chỉ sử dụng khi thanh toán bằng CARD
     * hoặc EWALLET.
     *
     * CASH có thể để NULL.
     */
    @Column(name = "transaction_id", length = 150)
    private String transactionId;

    /**
     * Nhà cung cấp ví điện tử.
     *
     * Ví dụ:
     * Momo
     * ZaloPay
     *
     * Chỉ sử dụng khi payment_method = EWALLET.
     */
    @Column(length = 100)
    private String provider;

    /**
     * Thời điểm thanh toán.
     */
    @Column(name = "paid_at")
    private LocalDateTime paidAt;
}