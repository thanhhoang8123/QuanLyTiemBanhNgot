package com.nhom4.QuanLyTiemBanhNgot.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entity đại diện cho bảng custom_orders.
 *
 * Dùng để lưu các đơn bánh được đặt theo yêu cầu riêng.
 *
 * Ví dụ:
 * - Bánh sinh nhật
 * - Bánh cưới
 * - Bánh có yêu cầu trang trí riêng
 *
 * Quan hệ:
 * Customer 1 ----- N CustomOrder
 * Employee 1 ----- N CustomOrder
 */
@Entity
@Table(name = "custom_orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CustomOrder {

    /**
     * Khóa chính.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Khách hàng đặt bánh.
     *
     * customer_id → customers.id
     */
    @ManyToOne
    @JoinColumn(name = "customer_id")
    private Customer customer;

    /**
     * Nhân viên tiếp nhận đơn.
     *
     * employee_id → employees.id
     */
    @ManyToOne
    @JoinColumn(name = "employee_id")
    private Employee employee;

    /**
     * Tên bánh khách yêu cầu.
     */
    @Column(name = "cake_name", length = 150)
    private String cakeName;

    /**
     * Mô tả yêu cầu của khách.
     *
     * Ví dụ:
     * - Màu bánh
     * - Hình dạng
     * - Chữ viết
     * - Trang trí
     */
    @Column(name = "request_description", columnDefinition = "TEXT")
    private String requestDescription;

    /**
     * Thời điểm khách đặt bánh.
     */
    @Column(name = "order_date")
    private LocalDateTime orderDate;

    /**
     * Thời điểm hẹn giao bánh.
     */
    @Column(name = "delivery_date")
    private LocalDateTime deliveryDate;

    /**
     * Giá dự kiến của bánh.
     */
    @Column(name = "estimated_price", precision = 15, scale = 2)
    private BigDecimal estimatedPrice;

    /**
     * Tiền khách đã đặt cọc.
     */
    @Column(precision = 15, scale = 2)
    private BigDecimal deposit;

    /**
     * Trạng thái đơn đặt bánh.
     *
     * Theo ERD:
     * PENDING
     * CONFIRMED
     * IN_PROGRESS
     * COMPLETED
     * CANCELLED
     */
    @Column(length = 30)
    private String status;
}