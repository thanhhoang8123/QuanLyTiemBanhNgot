-- Local development credentials only. This location is excluded from production Flyway.
SET @test_password_hash = '$2a$10$4iyrzR3kE80yajsk4JvqeeiHyTdWxBFNZFOVL8bzolzMpWtqw0i4.';

INSERT INTO customers (full_name, phone, email, address, loyalty_points, status)
SELECT 'Khách hàng kiểm thử', '0900000004', 'test.customer@example.invalid',
       'Địa chỉ mẫu phục vụ kiểm thử', 0, TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM customers WHERE email = 'test.customer@example.invalid'
);

INSERT INTO accounts
    (username, password_hash, role_id, email, email_verified, customer_id, status, created_at, updated_at)
SELECT 'test_admin', @test_password_hash, r.id, 'test.admin@example.invalid',
       TRUE, NULL, 'ACTIVE', NOW(), NOW()
FROM roles r
WHERE r.role_code = 'ADMIN'
  AND NOT EXISTS (SELECT 1 FROM accounts WHERE username = 'test_admin')
  AND NOT EXISTS (SELECT 1 FROM accounts WHERE email = 'test.admin@example.invalid');

INSERT INTO accounts
    (username, password_hash, role_id, email, email_verified, customer_id, status, created_at, updated_at)
SELECT 'test_manager', @test_password_hash, r.id, 'test.manager@example.invalid',
       TRUE, NULL, 'ACTIVE', NOW(), NOW()
FROM roles r
WHERE r.role_code = 'MANAGER'
  AND NOT EXISTS (SELECT 1 FROM accounts WHERE username = 'test_manager')
  AND NOT EXISTS (SELECT 1 FROM accounts WHERE email = 'test.manager@example.invalid');

INSERT INTO accounts
    (username, password_hash, role_id, email, email_verified, customer_id, status, created_at, updated_at)
SELECT 'test_staff', @test_password_hash, r.id, 'test.staff@example.invalid',
       TRUE, NULL, 'ACTIVE', NOW(), NOW()
FROM roles r
WHERE r.role_code = 'STAFF'
  AND NOT EXISTS (SELECT 1 FROM accounts WHERE username = 'test_staff')
  AND NOT EXISTS (SELECT 1 FROM accounts WHERE email = 'test.staff@example.invalid');

INSERT INTO accounts
    (username, password_hash, role_id, email, email_verified, customer_id, status, created_at, updated_at)
SELECT 'test_customer', @test_password_hash, r.id, 'test.customer@example.invalid',
       TRUE, c.id, 'ACTIVE', NOW(), NOW()
FROM roles r
CROSS JOIN customers c
WHERE r.role_code = 'CUSTOMER'
  AND c.email = 'test.customer@example.invalid'
  AND NOT EXISTS (SELECT 1 FROM accounts WHERE username = 'test_customer')
  AND NOT EXISTS (SELECT 1 FROM accounts WHERE email = 'test.customer@example.invalid');

INSERT INTO employees (account_id, full_name, phone, email, salary, status)
SELECT a.id, 'Nhân viên kiểm thử', '0900000003', 'test.staff@example.invalid', 0, TRUE
FROM accounts a
WHERE a.username = 'test_staff'
  AND NOT EXISTS (SELECT 1 FROM employees e WHERE e.account_id = a.id);
