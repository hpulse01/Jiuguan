-- 全文搜索索引（PostgreSQL）
-- 运行方式: psql -d jiuguan -f prisma/full-text-search.sql
-- 或在 db:push 之后手动执行

-- 添加 searchVector 列（tsvector 类型）
ALTER TABLE "FailureCase" ADD COLUMN IF NOT EXISTS "searchVector" tsvector;

-- 创建 GIN 索引加速全文搜索
CREATE INDEX IF NOT EXISTS "idx_failure_case_search" ON "FailureCase" USING GIN ("searchVector");

-- 更新函数：将多字段合并到 searchVector
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
    setweight(to_tsvector('simple', COALESCE(NEW."decisionPoint", '')), 'C') ||
    setweight(to_tsvector('simple', COALESCE(NEW."actionsTaken", '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器：INSERT 和 UPDATE 时自动更新 searchVector
DROP TRIGGER IF EXISTS trg_update_search_vector ON "FailureCase";
CREATE TRIGGER trg_update_search_vector
  BEFORE INSERT OR UPDATE ON "FailureCase"
  FOR EACH ROW
  EXECUTE FUNCTION update_failure_case_search_vector();

-- 初始化已有数据的 searchVector
UPDATE "FailureCase" SET
  "searchVector" =
    setweight(to_tsvector('simple', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(summary, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(background, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE("rootCause", '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE("adviceToOthers", '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE("earliestWarning", '')), 'C') ||
    setweight(to_tsvector('simple', COALESCE(outcome, '')), 'C') ||
    setweight(to_tsvector('simple', COALESCE("decisionPoint", '')), 'C') ||
    setweight(to_tsvector('simple', COALESCE("actionsTaken", '')), 'D');
