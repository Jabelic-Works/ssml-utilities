---
"@ssml-utilities/core": major
"@ssml-utilities/highlighter": patch
"@ssml-utilities/validation": minor
---

Split provider-aware SSML validation out of `@ssml-utilities/core` into a new `@ssml-utilities/validation` package.

`@ssml-utilities/core` now focuses on syntax parsing utilities, tokenization, DAG, and source spans. Provider profiles and `validateSSML()` move to the new validation package, and `@ssml-utilities/highlighter` now depends on it internally.
