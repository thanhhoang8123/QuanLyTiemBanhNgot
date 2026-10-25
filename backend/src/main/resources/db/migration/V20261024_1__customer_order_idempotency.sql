ALTER TABLE orders
    ADD COLUMN customer_request_key VARCHAR(36) NULL,
    ADD CONSTRAINT uk_orders_customer_request_key
        UNIQUE (customer_id, customer_request_key);
