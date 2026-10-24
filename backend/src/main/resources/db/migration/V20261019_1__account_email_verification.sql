ALTER TABLE accounts
    ADD COLUMN email VARCHAR(100) NULL,
    ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN customer_id BIGINT NULL,
    ADD COLUMN email_verification_token_hash VARCHAR(64) NULL,
    ADD COLUMN email_verification_token_expires_at DATETIME NULL,
    ADD CONSTRAINT uk_accounts_email UNIQUE (email),
    ADD CONSTRAINT uk_accounts_email_verification_token_hash UNIQUE (email_verification_token_hash),
    ADD INDEX ix_accounts_customer_id (customer_id),
    ADD CONSTRAINT fk_accounts_customer
        FOREIGN KEY (customer_id) REFERENCES customers (id);
