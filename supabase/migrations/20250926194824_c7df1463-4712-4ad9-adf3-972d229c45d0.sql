-- Fix security warning: Move vector extension to dedicated schema properly
-- Step 1: Create extensions schema first
CREATE SCHEMA IF NOT EXISTS extensions;

-- Step 2: Temporarily drop the vector column to remove dependency
ALTER TABLE public.knowledge_embeddings DROP COLUMN IF EXISTS embedding;

-- Step 3: Drop vector extension from public schema
DROP EXTENSION IF EXISTS vector;

-- Step 4: Create vector extension in extensions schema
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Step 5: Grant permissions on extensions schema
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO service_role;

-- Step 6: Re-add the embedding column using the extensions schema vector type
ALTER TABLE public.knowledge_embeddings 
ADD COLUMN embedding extensions.vector(1536);

-- Step 7: Recreate the vector index using the correct schema
DROP INDEX IF EXISTS knowledge_embeddings_embedding_idx;
CREATE INDEX knowledge_embeddings_embedding_idx 
ON public.knowledge_embeddings 
USING ivfflat (embedding extensions.vector_cosine_ops) 
WITH (lists = 100);