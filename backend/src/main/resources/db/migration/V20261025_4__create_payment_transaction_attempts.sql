CREATE TABLE payment_transaction_attempts (
    id BIGINT NOT NULL AUTO_INCREMENT,
    payment_id BIGINT NOT NULL,
    txn_ref VARCHAR(100) NOT NULL,
    amount_vnd BIGINT NOT NULL,
    status VARCHAR(30) NOT NULL,
    response_code VARCHAR(10) NULL,
    transaction_status VARCHAR(10) NULL,
    provider_transaction_no VARCHAR(100) NULL,
    bank_code VARCHAR(20) NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    completed_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_payment_transaction_attempts_txn_ref UNIQUE (txn_ref),
    CONSTRAINT fk_payment_transaction_attempts_payment
        FOREIGN KEY (payment_id) REFERENCES payments (id)
        ON DELETE RESTRICT,
    INDEX ix_payment_transaction_attempts_payment_id (payment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
