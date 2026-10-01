# Knowledge base

## Ingestion and provenance

`npm run kb:ingest` reads only `data/raw/synthetic/manifest.json` and its listed Markdown, CSV, and JSON files. Each persisted source record retains document ID, relative source path, source type, title, version, effective date, language, SHA-256 source hash, ingestion timestamp, synthetic flag, PII state, duplicate relationship, status, and raw metadata.

## Cleaning and terminology

Line endings and whitespace are normalized without removing headings, list items, tables, policy wording, or structured fields. Query normalization adds only tightly scoped search aliases: business loan/SME loan, monthly revenue/average revenue, and documents/paperwork. “Preliminary eligible” and “approved” are deliberately not merged.

## PII protection

The lightweight prototype detector flags email, phone, government-ID-like, account-number-like, address-like, and explicitly-labelled-name patterns. It redacts values before searchable text or debug representations. It is not production DLP; real systems require a dedicated, locale-aware DLP service and review.

## Duplicate handling

Exact normalized hashes and Jaccard token similarity are available for detection. Manifest-declared lineage wins for the intentional HSB-009 near duplicate: HSB-001 is canonical, while HSB-009 remains persisted for audit and is excluded from indexed chunks.

## Chunking and taxonomy

Markdown splits on heading boundaries; each FAQ question-answer pair is retained together; tables remain whole; large paragraphs split only at paragraph boundaries. CSV produces one structured field-record chunk per row, and JSON remains structured searchable text. Chunks retain source/version/hash, heading path, category, language, date, PII state, token count, and priority. Categories include product, qualification, policy, process, pricing, FAQ, objection, compliance, localization, and form.

## Versioning

Each retrieval citation carries the exact version, effective date, and source hash. A future document repository should select records effective at request time, mark superseded versions inactive rather than delete them, and permit rollback by selecting an earlier immutable hash.

## Limitations

The current index is an in-memory deterministic local adapter, rebuilt for each CLI/API process. It is intentionally not an external embedding provider, durable vector database, PDF/web extractor, production DLP system, or production ranking model.
