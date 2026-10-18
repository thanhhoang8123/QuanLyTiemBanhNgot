-- Preflight: no duplicate or NULL payments.order_id and no orphan Order references.
-- Existing tables are expected to be present before this migration runs.
ALTER TABLE payments
    MODIFY COLUMN order_id BIGINT NOT NULL,
    ADD CONSTRAINT uk_payments_order_id UNIQUE (order_id);
