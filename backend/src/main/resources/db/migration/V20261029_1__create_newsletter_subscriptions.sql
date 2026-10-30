CREATE TABLE newsletter_subscriptions (
    id BIGINT NOT NULL AUTO_INCREMENT,
    email VARCHAR(100) NOT NULL,
    consented_at DATETIME NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id),
    CONSTRAINT uk_newsletter_subscriptions_email UNIQUE (email)
);
