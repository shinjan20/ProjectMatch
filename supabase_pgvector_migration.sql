-- 1. Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add embedding columns to existing tables
-- We use 768 dimensions because Gemini's text-embedding-004 model outputs 768-dimensional vectors.
ALTER TABLE projects ADD COLUMN IF NOT EXISTS embedding vector(768);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS embedding vector(768);

-- 3. Create an index for faster similarity searches (optional but recommended for scale)
-- Note: HNSW requires the extension vector version >= 0.5.0
CREATE INDEX IF NOT EXISTS projects_embedding_idx ON projects USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS profiles_embedding_idx ON profiles USING hnsw (embedding vector_cosine_ops);

-- 4. Create RPC functions for semantic search

-- A. Match Projects (For Student queries)
CREATE OR REPLACE FUNCTION match_projects(
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  role text,
  domain text,
  tenure integer,
  remuneration numeric,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.role,
    p.domain,
    p.tenure,
    p.remuneration,
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM projects p
  -- Only return projects that have an embedding
  WHERE p.embedding IS NOT NULL
  -- Ensure similarity is above threshold (1 is exact match, 0 is orthogonal, -1 is opposite)
  AND 1 - (p.embedding <=> query_embedding) > match_threshold
  -- ORDER BY cosine similarity (closest vectors first)
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- B. Match Candidates (For Recruiter queries)
CREATE OR REPLACE FUNCTION match_candidates(
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  full_name text,
  role text,
  avatar_url text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pr.id,
    pr.full_name,
    pr.role,
    pr.avatar_url,
    1 - (pr.embedding <=> query_embedding) AS similarity
  FROM profiles pr
  -- Only match students
  WHERE pr.role = 'student'
  AND pr.embedding IS NOT NULL
  AND 1 - (pr.embedding <=> query_embedding) > match_threshold
  ORDER BY pr.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
