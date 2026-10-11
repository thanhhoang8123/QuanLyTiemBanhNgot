package com.nhom4.QuanLyTiemBanhNgot.repository;


import com.nhom4.QuanLyTiemBanhNgot.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository dùng để thao tác với bảng customers.
 *
 * JpaRepository đã cung cấp sẵn các chức năng CRUD cơ bản:
 *
 * - findAll()
 * - findById()
 * - save()
 * - deleteById()
 * - existsById()
 *
 * 
 */
public interface CustomerRepository extends JpaRepository<Customer, Long> {
}