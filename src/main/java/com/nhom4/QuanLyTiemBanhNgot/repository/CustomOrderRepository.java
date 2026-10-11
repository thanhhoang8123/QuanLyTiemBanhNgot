package com.nhom4.QuanLyTiemBanhNgot.repository;

import com.nhom4.QuanLyTiemBanhNgot.entity.CustomOrder;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository thao tác với bảng custom_orders.
 */
public interface CustomOrderRepository
        extends JpaRepository<CustomOrder, Long> {

}