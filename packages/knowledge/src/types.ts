export type KnowledgeCategory = "product" | "qualification" | "policy" | "process" | "pricing" | "disclosure" | "faq" | "objection" | "escalation" | "compliance" | "localization" | "form" | "notice";

export interface SourceMetadata {
  document_id: string; title: string; source_path: string; source_type: string; version: string;
  effective_date: string; language: string; source_hash: string; ingestion_timestamp: string;
  synthetic: true; pii_present: boolean; duplicate_of: string | null; canonical_document_id: string; status: "indexed" | "duplicate" | "quarantined"; metadata: Record<string, unknown>;
}
export interface SourceDocument extends SourceMetadata { normalized_content: string; searchable_text: string; pii_findings: PiiFinding[]; }
export interface PiiFinding { type: "email" | "phone" | "government_id" | "account_number" | "address" | "explicit_name"; start: number; end: number; }
export interface KnowledgeChunk {
  chunk_id: string; document_id: string; source_path: string; source_hash: string; title: string; heading_path: string[]; text: string; language: string; version: string; effective_date: string; synthetic: true; pii_present: boolean; chunk_index: number; character_count: number; token_count: number; category: KnowledgeCategory; priority: "normal" | "high"; metadata: Record<string, unknown>;
}
export interface Citation { document_id: string; source_path: string; title: string; heading: string; chunk_id: string; version: string; effective_date: string; source_hash: string; }
export interface SearchOptions { topK?: number; category?: KnowledgeCategory; language?: string; includeTrace?: boolean; }
export interface RankedResult { chunk: KnowledgeChunk; score: number; lexical_score: number; vector_score: number; retrieval_method: "hybrid-local"; citation: Citation; }
export interface RetrievalTrace { query: string; normalized_query: string; lexical_candidate_count: number; vector_candidate_count: number; metadata_filtered_count: number; threshold: number; selected_chunk_ids: string[]; fallback: boolean; }
export interface SearchResponse { query: string; answer_context: string | null; grounded: boolean; fallback: boolean; fallback_message: string | null; confidence: number; results: RankedResult[]; citations: Citation[]; trace?: RetrievalTrace; }
export interface EmbeddingProvider { name: string; embedDocuments(texts: string[]): number[][]; embedQuery(text: string): number[]; }
export interface VectorStore { upsert(chunks: KnowledgeChunk[], vectors: number[][]): void; search(vector: number[], topK: number): Array<{ chunk_id: string; score: number }>; }
export interface KnowledgeRetriever { search(query: string, options?: SearchOptions): SearchResponse; }
