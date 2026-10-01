# Retrieval

`HybridKnowledgeRetriever` is provider-agnostic through `EmbeddingProvider`, `VectorStore`, and `KnowledgeRetriever` interfaces. The active `prototype/local-hashing-embedding-adapter` uses 192-dimensional signed hashing vectors; it is a real local vector-similarity path, not a simulated commercial embedding call.

Ranking combines exact lexical query-term coverage (weight 0.55), vector cosine similarity (0.20), a 0.25 baseline for comparable score calibration, and a 0.05 priority bonus only when a high-priority policy/compliance chunk already has lexical evidence. Lexical coverage favors exact policy wording; vector similarity allows limited paraphrase matching. These values are intentionally visible and are regression-tested, not presented as production-optimized weights.

The central `SAFETY_POLICY.minimumRetrievalConfidence` threshold is 0.72. Below it, the API/CLI returns no context or citations and uses the central safe fallback. Above it, results include chunk text and citations with document ID, relative source path, title, heading, chunk ID, version, date, and source hash.

The optional retrieval trace exposes normalized (and PII-redacted) query representation, candidate counts, filtering count, ranking outcome, threshold, selected chunk IDs, and fallback state. It never needs to log raw PII.
