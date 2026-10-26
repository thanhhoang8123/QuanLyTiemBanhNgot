ALTER TABLE payment_transaction_attempts
    ADD COLUMN transaction_date VARCHAR(14) NULL
    AFTER amount_vnd;
