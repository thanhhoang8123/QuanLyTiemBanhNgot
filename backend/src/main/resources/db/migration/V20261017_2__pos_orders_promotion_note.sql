-- Existing order totals and order-item discount columns store the calculated amounts.
ALTER TABLE orders
    ADD COLUMN promotion_id BIGINT NULL,
    ADD COLUMN promotion_code_snapshot VARCHAR(30) NULL,
    ADD COLUMN note VARCHAR(500) NULL,
    ADD COLUMN stock_reserved BOOLEAN NOT NULL DEFAULT FALSE,
    ADD CONSTRAINT fk_orders_promotion
        FOREIGN KEY (promotion_id) REFERENCES promotions (id);
