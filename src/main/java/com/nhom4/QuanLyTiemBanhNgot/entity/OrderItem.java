package com.nhom4.QuanLyTiemBanhNgot.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * Entity đại diện cho bảng order_items.
 *
 * Mỗi OrderItem là một dòng sản phẩm
 * nằm trong một đơn hàng.
 *
 * Ví dụ:
 *
 * Đơn hàng DH001:
 * - 2 Bánh kem
 * - 3 Croissant
 *
 * thì bảng order_items sẽ có 2 dòng.
 *
 * Quan hệ:
 * Order 1 ----- N OrderItem
 * Product 1 ----- N OrderItem
 */
@Entity
@Table(name = "order_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OrderItem {

    /**
     * Khóa chính.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Đơn hàng chứa sản phẩm này.
     *
     * order_id → orders.id
     */
    @ManyToOne
    @JoinColumn(name = "order_id")
    private Order order;

    /**
     * Sản phẩm được mua.
     *
     * product_id → products.id
     */
    @ManyToOne
    @JoinColumn(name = "product_id")
    private Product product;

    /**
     * Số lượng sản phẩm.
     */
    @Column
    private Integer quantity;

    /**
     * Đơn giá tại thời điểm bán.
     *
     * Dùng BigDecimal vì đây là tiền.
     */
    @Column(name = "unit_price", precision = 15, scale = 2)
    private BigDecimal unitPrice;

    /**
     * Số tiền giảm cho sản phẩm này.
     */
    @Column(name = "discount_amount", precision = 15, scale = 2)
    private BigDecimal discountAmount;

    /**
     * Thành tiền của dòng sản phẩm.
     *
     * Công thức nghiệp vụ:
     *
     * lineTotal =
     * quantity * unitPrice - discountAmount
     */
    @Column(name = "line_total", precision = 15, scale = 2)
    private BigDecimal lineTotal;
}