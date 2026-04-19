CREATE INDEX IF NOT EXISTS knowledge_embeddings_embedding_idx
  ON public.knowledge_embeddings
  USING ivfflat (embedding extensions.vector_cosine_ops)
  WITH (lists = 100);

CREATE OR REPLACE FUNCTION public.match_knowledge_chunks(
  query_embedding extensions.vector,
  match_chatbot_id uuid,
  match_count int DEFAULT 6,
  similarity_threshold float DEFAULT 0.5
)
RETURNS TABLE (
  id uuid,
  knowledge_source_id uuid,
  content_chunk text,
  source_name text,
  similarity float
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT
    ke.id,
    ke.knowledge_source_id,
    ke.content_chunk,
    ks.name AS source_name,
    1 - (ke.embedding OPERATOR(extensions.<=>) query_embedding) AS similarity
  FROM public.knowledge_embeddings ke
  JOIN public.knowledge_sources ks ON ks.id = ke.knowledge_source_id
  WHERE ks.chatbot_id = match_chatbot_id
    AND ks.status = 'completed'
    AND 1 - (ke.embedding OPERATOR(extensions.<=>) query_embedding) > similarity_threshold
  ORDER BY ke.embedding OPERATOR(extensions.<=>) query_embedding
  LIMIT match_count;
$$;