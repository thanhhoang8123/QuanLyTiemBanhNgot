CREATE TABLE contact_messages (
    id BIGINT NOT NULL AUTO_INCREMENT,
    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(100) NOT NULL,
    subject VARCHAR(120) NOT NULL,
    message VARCHAR(3000) NOT NULL,
    created_at DATETIME NOT NULL,
    status VARCHAR(20) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_contact_messages_created_at (created_at),
    INDEX idx_contact_messages_status_created_at (status, created_at)
);
