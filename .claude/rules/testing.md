---
paths:
  - '**/*.test.ts'
  - '**/*.test.tsx'
  - '**/*.spec.ts'
  - '**/tests/**'
---

# Testing rules

- One behavior per test. Name: `<unit> <does what> when <condition>`.
- Arrange, act, assert. No logic (loops, conditionals) inside tests.
- Tests are deterministic and independent: no shared mutable state, no real network, no reliance on time or order. Fake the clock and outside services.
- Use a real test database (in-memory Mongo) for repositories and API integration tests. Reset state between tests. Mock only at true external boundaries.
- Every endpoint or action: happy path, invalid input (400), unauthenticated (401), other user's resource (403 or 404), not-found, and boundary values.
- Assert behavior and outputs, not implementation details.
- A bug fix starts with a failing test that reproduces it.
- Never weaken or delete an assertion to make a test pass.
