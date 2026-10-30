ALTER TABLE contact_messages
    ADD COLUMN customer_id BIGINT NULL,
    ADD CONSTRAINT fk_contact_messages_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE SET NULL,
    ADD INDEX idx_contact_messages_customer_id (customer_id);
