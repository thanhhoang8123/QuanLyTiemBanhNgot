-- Local development accounts only. This migration is excluded from production Flyway.
SET @test_password_hash = '$2a$10$cSVq6XBPXON5bmOxxpxRx.kzwBsz1zlyqbJHGo1KeRh4lZpgPKZlm';

UPDATE accounts
SET password_hash = @test_password_hash,
    updated_at = NOW()
WHERE username IN ('test_admin', 'test_manager', 'test_staff', 'test_customer');
