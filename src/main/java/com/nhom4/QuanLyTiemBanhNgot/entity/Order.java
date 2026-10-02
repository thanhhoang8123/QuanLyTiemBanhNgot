package com.nhom4.QuanLyTiemBanhNgot.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entity đại diện cho bảng "orders" trong database.
 *
 * Bảng orders lưu thông tin chung của một đơn hàng:
 * - Khách hàng nào đặt
 * - Nhân viên nào lập đơn
 * - Thời gian đặt hàng
 * - Địa chỉ giao hàng
 * - Tổng tiền
 * - Giảm giá
 * - Trạng thái đơn hàng
 *
 * Quan hệ:
 * Customer 1 ----- N Order
 * Employee 1 ----- N Order
 */
@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Order {

    /**
     * Khóa chính của đơn hàng.
     *
     * @GeneratedValue:
     *                  Database tự động tăng ID.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Mã đơn hàng.
     *
     * Ví dụ:
     * DH001
     * DH002
     */
    @Column(name = "order_code", length = 30)
    private String orderCode;

    /**
     * Khách hàng đặt đơn.
     *
     * Một Customer có thể có nhiều Order.
     *
     * customer_id trong database sẽ tham chiếu
     * đến customers.id.
     */
    @ManyToOne
    @JoinColumn(name = "customer_id")
    private Customer customer;

    /**
     * Nhân viên lập đơn.
     *
     * Một Employee có thể lập nhiều Order.
     *
     * employee_id trong database sẽ tham chiếu
     * đến employees.id.
     */
    @ManyToOne
    @JoinColumn(name = "employee_id")
    private Employee employee;

    /**
     * Thời điểm khách đặt hàng.
     *
     * Database: TIMESTAMP
     * Java: LocalDateTime
     */
    @Column(name = "order_date")
    private LocalDateTime orderDate;

    /**
     * Địa chỉ giao hàng.
     *
     * Có thể NULL nếu khách mua trực tiếp tại cửa hàng.
     */
    @Column(name = "delivery_address", length = 255)
    private String deliveryAddress;

    /**
     * Trạng thái giao hàng.
     *
     * Theo ERD:
     * - NOT_REQUIRED
     * - PENDING
     * - DELIVERED
     */
    @Column(name = "delivery_status", length = 30)
    private String deliveryStatus;

    /**
     * Tổng tiền trước khi giảm giá.
     *
     * Dùng BigDecimal vì đây là dữ liệu tiền tệ.
     */
    @Column(name = "total_amount", precision = 15, scale = 2)
    private BigDecimal totalAmount;

    /**
     * Số tiền được giảm từ chương trình khuyến mãi.
     *
     * Dùng BigDecimal để đảm bảo độ chính xác tiền tệ.
     */
    @Column(name = "discount_amount", precision = 15, scale = 2)
    private BigDecimal discountAmount;

    /**
     * Trạng thái của đơn hàng.
     *
     * Theo ERD:
     * - PENDING
     * - CONFIRMED
     * - COMPLETED
     * - CANCELLED
     */
    @Column(length = 30)
    private String status;

    /**
     * Thời điểm tạo bản ghi đơn hàng.
     */
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}