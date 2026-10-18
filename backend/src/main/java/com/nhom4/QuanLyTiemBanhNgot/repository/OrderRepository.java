package com.nhom4.QuanLyTiemBanhNgot.repository;

import com.nhom4.QuanLyTiemBanhNgot.entity.Order;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
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

    boolean existsByCustomer_Id(Long customerId);

    @EntityGraph(attributePaths = {"customer", "employee"})
    List<Order> findAllByOrderByOrderDateDesc();

    @Override
    @EntityGraph(attributePaths = {"customer", "employee"})
    Optional<Order> findById(Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select orderEntity from Order orderEntity where orderEntity.id = :id")
    Optional<Order> findByIdForUpdate(@Param("id") Long id);
}