package com.nhom4.QuanLyTiemBanhNgot.repository;


import com.nhom4.QuanLyTiemBanhNgot.entity.Customer;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

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

    boolean existsByEmailIgnoreCase(String email);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select customer from Customer customer where customer.id = :id")
    Optional<Customer> findByIdForUpdate(@Param("id") Long id);

    List<Customer> findByFullNameContainingIgnoreCaseOrPhoneContaining(
            String fullNameKeyword,
            String phoneKeyword
    );

    Page<Customer> findByFullNameContainingIgnoreCaseOrPhoneContaining(
            String fullNameKeyword,
            String phoneKeyword,
            Pageable pageable
    );

    @Query("""
            select customer from Customer customer
            where (:keyword is null
                    or lower(customer.fullName) like lower(concat('%', :keyword, '%'))
                    or lower(customer.phone) like lower(concat('%', :keyword, '%'))
                    or lower(customer.email) like lower(concat('%', :keyword, '%')))
            """)
    Page<Customer> findPageByKeyword(@Param("keyword") String keyword, Pageable pageable);
}