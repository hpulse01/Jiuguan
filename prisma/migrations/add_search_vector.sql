-- 全文搜索优化：添加 searchVector 列、GIN 索引和自动更新触发器
-- 运行方式：psql $DATABASE_URL -f prisma/migrations/add_search_vector.sql

-- 1. 添加 searchVector 列（如果不存在）
ALTER TABLE "FailureCase"
  ADD COLUMN IF NOT EXISTS "searchVector" tsvector;

-- 2. 创建 GIN 索引
CREATE INDEX IF NOT EXISTS "FailureCase_searchVector_idx"
  ON "FailureCase" USING GIN ("searchVector");

-- 3. 创建/替换触发器函数：自动更新 searchVector
CREATE OR REPLACE FUNCTION update_failure_case_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('simple', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.summary, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.background, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW."rootCause", '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW."adviceToOthers", '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW."earliestWarning", '')), 'C') ||
    setweight(to_tsvector('simple', COALESCE(NEW.outcome, '')), 'C') ||
    setweight(to_tsvector('simple', COALESCE(NEW."originalGoal", '')), 'C') ||
    setweight(to_tsvector('simple', COALESCE(NEW."decisionPoint", '')), 'C') ||
    setweight(to_tsvector('simple', COALESCE(NEW."actionsTaken", '')), 'D') ||
    setweight(to_tsvector('simple', COALESCE(NEW."ignoredSignals", '')), 'D') ||
    setweight(to_tsvector('simple', COALESCE(NEW."whatWouldDoDifferently", '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. 创建触发器（先删除已存在的，再创建）
DROP TRIGGER IF EXISTS trigger_update_search_vector ON "FailureCase";
CREATE TRIGGER trigger_update_search_vector
  BEFORE INSERT OR UPDATE ON "FailureCase"
  FOR EACH ROW
  EXECUTE FUNCTION update_failure_case_search_vector();

-- 5. 回填现有数据的 searchVector
UPDATE "FailureCase" SET
  "searchVector" =
    setweight(to_tsvector('simple', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(summary, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(background, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE("rootCause", '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE("adviceToOthers", '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE("earliestWarning", '')), 'C') ||
    setweight(to_tsvector('simple', COALESCE(outcome, '')), 'C') ||
    setweight(to_tsvector('simple', COALESCE("originalGoal", '')), 'C') ||
    setweight(to_tsvector('simple', COALESCE("decisionPoint", '')), 'C') ||
    setweight(to_tsvector('simple', COALESCE("actionsTaken", '')), 'D') ||
    setweight(to_tsvector('simple', COALESCE("ignoredSignals", '')), 'D') ||
    setweight(to_tsvector('simple', COALESCE("whatWouldDoDifferently", '')), 'D');
