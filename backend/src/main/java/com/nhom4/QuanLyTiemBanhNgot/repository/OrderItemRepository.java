package com.nhom4.QuanLyTiemBanhNgot.repository;

import com.nhom4.QuanLyTiemBanhNgot.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

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

    List<OrderItem> findByOrder_Id(Long orderId);

    List<OrderItem> findByOrder_IdIn(List<Long> orderIds);
}