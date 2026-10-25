INSERT INTO employees (account_id, full_name, phone, email, salary, status)
SELECT a.id, 'Quản trị viên kiểm thử', '0900000001',
       'test.admin@example.invalid', 0, TRUE
FROM accounts a
WHERE a.username = 'test_admin'
  AND NOT EXISTS (
      SELECT 1
      FROM employees e
      WHERE e.account_id = a.id
  );

INSERT INTO employees (account_id, full_name, phone, email, salary, status)
SELECT a.id, 'Quản lý kiểm thử', '0900000002',
       'test.manager@example.invalid', 0, TRUE
FROM accounts a
WHERE a.username = 'test_manager'
  AND NOT EXISTS (
      SELECT 1
      FROM employees e
      WHERE e.account_id = a.id
  );
