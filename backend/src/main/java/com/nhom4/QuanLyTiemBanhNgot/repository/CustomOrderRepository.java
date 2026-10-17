package com.nhom4.QuanLyTiemBanhNgot.repository;

import com.nhom4.QuanLyTiemBanhNgot.entity.CustomOrder;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

/**
 * Repository thao tác với bảng custom_orders.
 */
public interface CustomOrderRepository
        extends JpaRepository<CustomOrder, Long> {

    boolean existsByCustomer_Id(Long customerId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select customOrder from CustomOrder customOrder where customOrder.id = :id")
    Optional<CustomOrder> findByIdForUpdate(@Param("id") Long id);
}