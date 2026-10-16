package com.nhom4.QuanLyTiemBanhNgot.entity;



import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "promotions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Promotion {

    // Khóa chính của bảng promotions
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Mã khuyến mãi
    @Column(name = "promotion_code", length = 30)
    private String promotionCode;

    // Tên chương trình khuyến mãi
    @Column(length = 100)
    private String name;

    // Phần trăm giảm giá
    // Ví dụ: 10.00 = giảm 10%
    @Column(name = "discount_percent", precision = 5, scale = 2)
    private BigDecimal discountPercent;

    // Số tiền giảm tối đa
    @Column(name = "max_discount", precision = 15, scale = 2)
    private BigDecimal maxDiscount;

    // Giá trị đơn hàng tối thiểu để áp dụng khuyến mãi
    @Column(name = "min_order_value", precision = 15, scale = 2)
    private BigDecimal minOrderValue;

    // Ngày bắt đầu khuyến mãi
    @Column(name = "start_date")
    private LocalDate startDate;

    // Ngày kết thúc khuyến mãi
    @Column(name = "end_date")
    private LocalDate endDate;

    // Trạng thái:
    // true  = đang hoạt động
    // false = ngừng hoạt động
    @Column
    private Boolean status;
}