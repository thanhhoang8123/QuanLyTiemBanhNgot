package com.nhom4.QuanLyTiemBanhNgot.repository;

import com.nhom4.QuanLyTiemBanhNgot.entity.PaymentTransactionAttempt;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface PaymentTransactionAttemptRepository
        extends JpaRepository<PaymentTransactionAttempt, Long> {

    Optional<PaymentTransactionAttempt> findByTxnRef(String txnRef);

    @Query("""
            select attempt
            from PaymentTransactionAttempt attempt
            join fetch attempt.payment payment
            join fetch payment.order orderEntity
            join fetch orderEntity.customer customer
            where attempt.txnRef = :txnRef
              and customer.id = :customerId
            """)
    Optional<PaymentTransactionAttempt> findByTxnRefAndCustomerId(
            @Param("txnRef") String txnRef,
            @Param("customerId") Long customerId
    );

    @Query("""
            select attempt
            from PaymentTransactionAttempt attempt
            join fetch attempt.payment payment
            join fetch payment.order orderEntity
            join fetch orderEntity.customer customer
            where orderEntity.id = :orderId
              and customer.id = :customerId
            order by attempt.createdAt desc, attempt.id desc
            """)
    List<PaymentTransactionAttempt> findByOrderIdAndCustomerId(
            @Param("orderId") Long orderId,
            @Param("customerId") Long customerId,
            Pageable pageable
    );

    List<PaymentTransactionAttempt> findByPayment_IdOrderByCreatedAtDesc(Long paymentId);

    boolean existsByPayment_Id(Long paymentId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select attempt
            from PaymentTransactionAttempt attempt
            where attempt.txnRef = :txnRef
            """)
    Optional<PaymentTransactionAttempt> findByTxnRefForUpdate(
            @Param("txnRef") String txnRef
    );
}
