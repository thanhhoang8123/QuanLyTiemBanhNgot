package com.nhom4.QuanLyTiemBanhNgot.repository;

import com.nhom4.QuanLyTiemBanhNgot.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository dùng để thao tác với bảng orders.
 *
 * JpaRepository<Order, Long>:
 *
 * Order:
 * Entity mà Repository quản lý.
 *
 * Long:
 * Kiểu dữ liệu của khóa chính Order.id.
 *
 * Spring Data JPA cung cấp sẵn các phương thức CRUD:
 *
 * findAll()
 * findById()
 * save()
 * deleteById()
 * existsById()
 *
 * Vì đã extends JpaRepository nên không cần
 * tự viết câu SQL cho CRUD cơ bản.
 */
public interface OrderRepository extends JpaRepository<Order, Long> {

}