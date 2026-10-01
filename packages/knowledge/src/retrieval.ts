import { SAFETY_POLICY } from "../../shared/src/safety.js";
import { normalizeQuery, tokenize } from "./normalization.js";
import type { Citation, EmbeddingProvider, KnowledgeChunk, KnowledgeRetriever, RankedResult, RetrievalTrace, SearchOptions, SearchResponse, VectorStore } from "./types.js";

const DIMENSIONS = 192;
function hashToken(token: string) { let value = 2166136261; for (const character of token) { value ^= character.charCodeAt(0); value = Math.imul(value, 16777619); } return value >>> 0; }
function cosine(left: number[], right: number[]) { let dot = 0; let a = 0; let b = 0; for (let index = 0; index < left.length; index += 1) { dot += left[index] * right[index]; a += left[index] ** 2; b += right[index] ** 2; } return a && b ? dot / Math.sqrt(a * b) : 0; }
export class LocalHashingEmbeddingProvider implements EmbeddingProvider {
  readonly name = "prototype/local-hashing-embedding-adapter";
  embedDocuments(texts: string[]) { return texts.map((text) => this.embedQuery(text)); }
  embedQuery(text: string) { const vector = Array.from({ length: DIMENSIONS }, () => 0); for (const token of tokenize(text)) { const hash = hashToken(token); vector[hash % DIMENSIONS] += hash % 2 ? 1 : -1; } return vector; }
}
export class InMemoryVectorStore implements VectorStore {
  private values = new Map<string, number[]>();
  upsert(chunks: KnowledgeChunk[], vectors: number[][]) { chunks.forEach((chunk, index) => this.values.set(chunk.chunk_id, vectors[index])); }
  search(vector: number[], topK: number) { return [...this.values.entries()].map(([chunk_id, candidate]) => ({ chunk_id, score: Math.max(0, cosine(vector, candidate)) })).sort((a, b) => b.score - a.score).slice(0, topK); }
  deleteByDocument(documentId: string) { for (const chunkId of this.values.keys()) if (chunkId.startsWith(`${documentId}::`)) this.values.delete(chunkId); }
}
const termSynonyms: Record<string, string[]> = {
  requir: ["request"],
  request: ["requir"],
  fee: ["charge", "cost", "pric", "rate"],
  charge: ["fee", "cost", "pric"],
  cost: ["fee", "charge", "pric"],
  pric: ["fee", "charge", "cost", "rate"],
  interest: ["rate", "pric", "fee"],
  rate: ["interest", "pric", "fee"],
  loan: ["product"]
};
function lexicalScore(query: string, text: string) {
  const terms = tokenize(query);
  const corpus = new Set(tokenize(text));
  if (!terms.length) return 0;
  return terms.filter((term) => corpus.has(term) || termSynonyms[term]?.some((syn) => corpus.has(syn))).length / terms.length;
}
function citationFor(chunk: KnowledgeChunk): Citation { return { document_id: chunk.document_id, source_path: chunk.source_path, title: chunk.title, heading: chunk.heading_path.join(" > "), chunk_id: chunk.chunk_id, version: chunk.version, effective_date: chunk.effective_date, source_hash: chunk.source_hash }; }
function intendedCategories(query: string): KnowledgeChunk["category"][] {
  const terms = new Set(tokenize(query));
  if (["guarantee", "approved", "approval"].some((term) => terms.has(term))) return [];
  if (["fee", "charge", "cost", "pric", "interest"].some((term) => terms.has(term))) return ["pricing"];
  if (["revenue", "operat", "registered", "eligible"].some((term) => terms.has(term))) return ["qualification", "policy"];
  if (terms.has("document") && (terms.has("requir") || terms.has("request") || terms.has("process"))) return ["process"];
  if (["document", "application", "apply"].some((term) => terms.has(term))) return ["process", "faq"];
  if (["share", "information", "interested", "difficult"].some((term) => terms.has(term))) return ["objection", "compliance"];
  if (["harborspring", "harborflex", "harborequip", "loan"].some((term) => terms.has(term))) return ["product"];
  return [];
}

export class HybridKnowledgeRetriever implements KnowledgeRetriever {
  constructor(private readonly chunks: KnowledgeChunk[], private readonly embeddings: EmbeddingProvider = new LocalHashingEmbeddingProvider(), private readonly vectorStore: VectorStore = new InMemoryVectorStore()) { this.vectorStore.upsert(chunks, embeddings.embedDocuments(chunks.map((chunk) => chunk.text))); }
  search(query: string, options: SearchOptions = {}): SearchResponse {
    const normalized = normalizeQuery(query); const topK = options.topK ?? 3; const eligible = this.chunks.filter((chunk) => (!options.category || chunk.category === options.category) && (!options.language || chunk.language.includes(options.language)));
    const highRiskGuaranteeRequest = /\bguarantee\b[\s\S]*\b(?:approval|approved)\b|\b(?:approval|approved)\b[\s\S]*\bguarantee\b/i.test(query);
    const vectorCandidates = new Map(this.vectorStore.search(this.embeddings.embedQuery(normalized), Math.max(topK * 4, 12)).map((candidate) => [candidate.chunk_id, candidate.score]));
    const ranked = eligible.map((chunk) => {
      const lexical = lexicalScore(normalized, `${chunk.title} ${chunk.heading_path.join(" ")} ${chunk.text}`); const vector = vectorCandidates.get(chunk.chunk_id) ?? 0;
      const categoryBonus = intendedCategories(normalized).includes(chunk.category) && lexical > 0 ? 0.12 : 0;
      const metadataBonus = chunk.priority === "high" && lexical > 0 ? 0.05 : 0;
      // Lexical coverage protects exact policy wording; hashing-vector similarity improves paraphrase recall.
      const score = Math.min(1, 0.22 + (0.48 * lexical) + (0.18 * vector) + metadataBonus + categoryBonus);
      return { chunk, score, lexical_score: lexical, vector_score: vector, retrieval_method: "hybrid-local" as const, citation: citationFor(chunk) };
    }).sort((a, b) => b.score - a.score).slice(0, topK);
    const confidence = ranked[0]?.score ?? 0; const fallback = highRiskGuaranteeRequest || confidence < SAFETY_POLICY.minimumRetrievalConfidence;
    const trace: RetrievalTrace = { query: normalizeQuery(query), normalized_query: normalized, lexical_candidate_count: ranked.filter((item) => item.lexical_score > 0).length, vector_candidate_count: vectorCandidates.size, metadata_filtered_count: eligible.length, threshold: SAFETY_POLICY.minimumRetrievalConfidence, selected_chunk_ids: fallback ? [] : ranked.map((item) => item.chunk.chunk_id), fallback };
    return { query, answer_context: fallback ? null : ranked[0].chunk.text, grounded: !fallback, fallback, fallback_message: fallback ? SAFETY_POLICY.unsupportedQuestionFallback : null, confidence, results: fallback ? [] : ranked, citations: fallback ? [] : ranked.map((item) => item.citation), ...(options.includeTrace ? { trace } : {}) };
  }
}
