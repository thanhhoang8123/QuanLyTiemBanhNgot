package com.nhom4.QuanLyTiemBanhNgot.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "payment_transaction_attempts",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_payment_transaction_attempts_txn_ref",
                columnNames = "txn_ref"
        ),
        indexes = @Index(
                name = "ix_payment_transaction_attempts_payment_id",
                columnList = "payment_id"
        )
)
@Getter
@Setter
@NoArgsConstructor
public class PaymentTransactionAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "payment_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_payment_transaction_attempts_payment")
    )
    private Payment payment;

    @Column(name = "txn_ref", nullable = false, length = 100)
    private String txnRef;

    @Column(name = "amount_vnd", nullable = false)
    private Long amountVnd;

    @Column(name = "transaction_date", length = 14)
    private String transactionDate;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "response_code", length = 10)
    private String responseCode;

    @Column(name = "transaction_status", length = 10)
    private String transactionStatus;

    @Column(name = "provider_transaction_no", length = 100)
    private String providerTransactionNo;

    @Column(name = "bank_code", length = 20)
    private String bankCode;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}
