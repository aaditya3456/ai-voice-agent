# Synthetic data boundary

Every business fact in this repository is fictional and exists only to demonstrate an AI engineering assessment prototype. HarborSpring Business Finance, HSC, all products, rules, pricing illustrations, and localized scripts are invented.

No assessment provider business source data was supplied. No real customer records, real PII, actual financial products, or real regulatory requirements are represented. The data pack must not be used for lending, insurance, consumer-finance, or compliance decisions.

## Provenance model

Each raw source carries a deterministic `document_id`, version, effective date, language, and a synthetic marker. `data/raw/synthetic/manifest.json` adds the source path, canonical/duplicate relationship, and SHA-256 content hash. The validation script verifies all of these fields before later ingestion is allowed.

## PII handling

The field dictionary labels contact fields as direct PII. The synthetic sample customers use aliases and blank contact values. Later ingestion and logging must redact or omit direct PII before indexing or structured logging.

## Localization boundary

Philippines and Indonesia content is synthetic copy for product demonstrations. It has not been native-speaker, legal, regulatory, or compliance validated.
