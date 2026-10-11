package com.nhom4.QuanLyTiemBanhNgot.entity;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Entity Customer
 *
 * Đại diện cho bảng "customers" trong database.
 *
 * Mục đích:
 * - Lưu thông tin khách hàng.
 * - Quản lý điểm tích lũy.
 * - Quản lý trạng thái khách hàng.
 */
@Entity
@Table(name = "customers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Customer {

    /**
     * Khóa chính của khách hàng.
     *
     * GenerationType.IDENTITY:
     * - ID được MySQL tự động tăng.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Họ và tên khách hàng.
     */
    @Column(name = "full_name", length = 100)
    private String fullName;

    /**
     * Số điện thoại khách hàng.
     */
    @Column(length = 15)
    private String phone;

    /**
     * Email khách hàng.
     */
    @Column(length = 100)
    private String email;

    /**
     * Địa chỉ khách hàng.
     */
    @Column(length = 255)
    private String address;

    /**
     * Điểm tích lũy của khách hàng.
     */
    @Column(name = "loyalty_points")
    private Integer loyaltyPoints;

    /**
     * Trạng thái khách hàng.
     *
     * true = đang hoạt động
     * false = ngừng hoạt động
     */
    @Column
    private Boolean status;
}