package com.nhom4.QuanLyTiemBanhNgot.repository;

import com.nhom4.QuanLyTiemBanhNgot.entity.Order;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

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

    boolean existsByOrderCode(String orderCode);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select orderEntity from Order orderEntity where orderEntity.id = :id")
    Optional<Order> findByIdForUpdate(@Param("id") Long id);
}