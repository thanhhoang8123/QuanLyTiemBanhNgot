-- Preflight required: no duplicate or NULL payments.order_id and no orphan Order references.
-- Apply after the existing tables have been created.
ALTER TABLE payments
    MODIFY COLUMN order_id BIGINT NOT NULL,
    ADD CONSTRAINT uk_payments_order_id UNIQUE (order_id);
