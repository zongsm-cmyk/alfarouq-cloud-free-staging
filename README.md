# ALFAROUQ Cloud — free hosting compatibility probe

This repository is an **isolated, deliberately inert** deployment canary. It is **not** the ALFAROUQ production Broker. It has **no** signing keys, database URLs, owner-session tokens, or access to Windows agents.

## What is supported

- `GET /health` returns HTTP 200 with `production_connected: false`.
- `GET /ready` returns HTTP 503 until genuine production integration is qualified.
- All task, queue and command endpoints return HTTP 503 and `effect_boundary: NOT_CROSSED`.
- `npm test` tests all five cases with synthetic requests and no external credentials.

## Explicitly not included

Railway's original Bun/Hono+PostgreSQL Broker, its queue/leases/fencing and signing identities, real durable storage or replay of pending/UNKNOWN operations. Do not route real ALFAROUQ traffic here.

## Free-tier constraints

The Render Free web service sleeps after roughly 15 minutes idle, so this probe is **not 24/7 continuous processing**. Any production design requires a durable database, a signed source review, anti-replay and acceptance tests. Do not attach a paid instance or credit card.

## Local

Run `npm test`, then `npm start`; the process binds on `0.0.0.0:${PORT:-10000}`. No package dependencies are required.
