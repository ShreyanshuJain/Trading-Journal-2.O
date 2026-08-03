---
name: Vite env type declarations
description: How to make import.meta.env work with TypeScript in this Vite project
---

## Rule
The tsconfig.json does not include `"types": ["vite/client"]`. To use `import.meta.env` in TypeScript without errors, add `src/vite-env.d.ts` containing:

```ts
/// <reference types="vite/client" />
```

**Why:** Without it, `tsc --noEmit` reports `Property 'env' does not exist on type 'ImportMeta'` for every `import.meta.env.*` access.

**How to apply:** Any file using `import.meta.env` will work as long as `src/vite-env.d.ts` exists. Do not add `"types"` to tsconfig; the reference file is the standard Vite approach.
