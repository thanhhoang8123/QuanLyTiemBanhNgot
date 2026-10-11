package com.nhom4.QuanLyTiemBanhNgot.repository;

import com.nhom4.QuanLyTiemBanhNgot.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository thao tác với bảng order_items.
 *
 * OrderItem:
 * Entity quản lý.
 *
 * Long:
 * Kiểu khóa chính OrderItem.id.
 */
public interface OrderItemRepository
        extends JpaRepository<OrderItem, Long> {

}