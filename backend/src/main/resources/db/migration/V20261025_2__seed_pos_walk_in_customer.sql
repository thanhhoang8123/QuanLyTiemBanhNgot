INSERT INTO customers (full_name, phone, email, address, loyalty_points, status)
SELECT 'Khách vãng lai', NULL, 'pos.walkin@example.invalid', NULL, 0, TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM customers
    WHERE email = 'pos.walkin@example.invalid'
);
