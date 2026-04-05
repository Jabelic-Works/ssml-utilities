---
"@ssml-utilities/highlighter": patch
---

Refactor the highlighter tree renderer to remove the internal circular dependency between `children.ts` and `node.ts` while keeping the existing output and API behavior.
