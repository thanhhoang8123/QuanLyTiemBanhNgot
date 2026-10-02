package com.nhom4.QuanLyTiemBanhNgot.repository;

import com.nhom4.QuanLyTiemBanhNgot.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository thao tác với bảng payments.
 */
public interface PaymentRepository
        extends JpaRepository<Payment, Long> {

}