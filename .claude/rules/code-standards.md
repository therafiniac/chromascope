# Code standards

Applies whenever you write, edit, or review code. Default to production quality unless I say "prototype".

## Before coding

Know: what is being built, who calls it, what success looks like, what must be true first (validation, auth, rules), what state changes, and what is returned on every failure path.
Flow for input-handling code: receive → validate → authenticate → authorize → business rules → read/write → handle errors → return.

## Security (priority order)

1. Authorize every resource access: confirm the caller may act on this specific resource, not just that they are logged in.
2. Validate all input server-side at every boundary (body, params, query, env, uploads): type, format, length, range. Use a schema.
3. No secrets in code or logs. Env vars only. Provide .env.example.
4. Hash passwords with argon2, bcrypt, or scrypt.
5. Parameterized queries only. Guard against NoSQL operator injection. Never build shell commands from input.
6. Escape output. Never render user-supplied HTML unsanitized.
7. Cookies: HttpOnly, Secure, SameSite. CSRF protection on cookie-authenticated mutations.
8. Least privilege for services and DB users.
9. Rate limit auth, search, and costly endpoints.
10. Flag vulnerable or unmaintained dependencies.

## Errors

- Handle failure at every I/O boundary (network, DB, files, external APIs).
- Use typed errors mapped to the right status: validation, not-found, unauthorized, forbidden, conflict, rate-limited, server.
- Clients get actionable messages, never stack traces. Log full detail server-side.
- No empty catch, no swallowed errors. Retry only idempotent operations.

## Quality

- Intention-revealing names. One job per function. Comments explain why, not what.
- Match existing style. Explicit over clever.
- Order: make it work → correct → clean → fast.
- Extract shared logic on the third use, not before.

## Testing

For non-trivial code cover: happy path, invalid input, unauthorized access, not-found, boundary values, and concurrency where relevant.

## Performance

- Measure before optimizing, but never ship N+1 queries or unbounded result sets.
- Paginate lists. Index filtered and sorted fields.
- Cache only with a known invalidation trigger.

## Logging and config

- Structured, leveled logs with IDs for context. Log auth failures and key business events. Never log secrets or PII.
- No environment-specific values in source. Fail fast at startup on missing env vars.

## Frontend

- Handle loading, success, empty, and error states.
- Semantic HTML, keyboard access, contrast, alt text.
- No tokens in localStorage. Choose state ownership deliberately (local, shared, server, URL).

## Docs and changes

- Document new public functions and endpoints (purpose, inputs, outputs). Update stale docs.
- Call out breaking changes explicitly: API contracts, schema, env vars.
