-- The unique key may already exist if the older SQL migration was run manually.
SET @promotion_code_unique_exists = (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'promotions'
      AND index_name = 'uk_promotions_promotion_code'
      AND non_unique = 0
      AND column_name = 'promotion_code'
);

SET @promotion_code_unique_sql = IF(
    @promotion_code_unique_exists = 0,
    'ALTER TABLE promotions ADD CONSTRAINT uk_promotions_promotion_code UNIQUE (promotion_code)',
    'SELECT 1'
);

PREPARE promotion_code_unique_statement FROM @promotion_code_unique_sql;
EXECUTE promotion_code_unique_statement;
DEALLOCATE PREPARE promotion_code_unique_statement;
