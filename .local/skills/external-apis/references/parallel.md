# Parallel

Proxy requests to Parallel via Replit-managed billing.

## Callback

Use `externalApi__parallel` in `codeExecution`.

## Allowed operations

- `POST` `/v1/search` - Web search returning ranked URLs with excerpts (turbo/basic/advanced modes).

Authorization is handled automatically by Replit. Do not pass an `Authorization` header.

## Quickstart

1. Call the callback with a `path` and `method` exactly as listed under Allowed operations — do not add or remove version prefixes (e.g. `/scrape`, not `/v1/scrape`).
2. For GET, put URL params in `query`. For POST/PUT/PATCH, pass a JSON object as `body` (it is serialized for you).
3. Inspect `result.body`.

## Example

```javascript
const result = await externalApi__parallel({
  path: '/v1/search',
  method: 'POST',
  body: {},
})

console.log(result.status)
console.log(result.body)
```
