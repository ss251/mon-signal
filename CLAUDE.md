# Mon-Signal Claude Context

## Quick Start

When resuming work on this project:
1. Check `memories/architecture/arch-implementation-status.md` for current build status
2. Review the key files section below for entry points
3. Run `pnpm dev` for Next.js and `cd indexer && pnpm dev` for Envio indexer

---

## Project Overview

Mon-Signal is a Farcaster Mini App that shows users trading signals from people they follow on Monad. The app indexes ERC20 transfers via Envio HyperIndex and enriches them with Farcaster user data via Neynar.

---

## Key Files

### Frontend (Next.js)
| Path | Purpose |
|------|---------|
| `app/page.tsx` | Main app entry, tab navigation |
| `components/views/FeedView.tsx` | Trade feed with filters, fetches from /api/trades |
| `components/ui/TradeCard.tsx` | Individual trade display component |
| `components/farcaster-provider.tsx` | Farcaster SDK context |

### API Routes
| Path | Purpose |
|------|---------|
| `app/api/trades/route.ts` | GET endpoint for trades, enriches with Farcaster data |
| `app/api/webhook/route.ts` | Farcaster webhook handler |

### Libraries
| Path | Purpose |
|------|---------|
| `lib/envio.ts` | GraphQL client for Envio indexer |
| `lib/neynar.ts` | Neynar API client (wallet→Farcaster lookup) |
| `lib/notifs.ts` | Notification helpers |
| `lib/kv.ts` | Upstash Redis client |

### Indexer (Envio HyperIndex)
| Path | Purpose |
|------|---------|
| `indexer/config.yaml` | Envio config (Monad testnet, ERC20 events) |
| `indexer/schema.graphql` | Trade and Account entities |
| `indexer/src/EventHandlers.ts` | ERC20 Transfer handler (wildcard mode) |

### Documentation
| Path | Purpose |
|------|---------|
| `memories/architecture/arch-implementation-status.md` | Build progress tracker |
| `memories/architecture/arch-system-overview.md` | System architecture |
| `memories/architecture/arch-data-flow-pipeline.md` | Data flow diagrams |
| `docs/idea.md` | Product concept |
| `docs/envio/` | Envio HyperIndex documentation |

---

## Environment Variables

### Next.js App (`.env.local`)
```
NEXT_PUBLIC_URL=             # App URL for Farcaster frame
UPSTASH_REDIS_REST_URL=      # Redis for social graph cache
UPSTASH_REDIS_REST_TOKEN=    # Redis auth token
NEYNAR_API_KEY=              # Neynar API for Farcaster data
ENVIO_GRAPHQL_URL=           # Envio GraphQL endpoint (default: localhost:8080)
ENVIO_ADMIN_SECRET=          # Hasura admin secret (default: testing)
```

### Indexer (`indexer/.env`)
```
ENVIO_API_TOKEN=             # For hosted deployment
MONAD_TESTNET_RPC_URL=       # Alchemy RPC for Monad testnet
```

---

## Running Locally

```bash
# Next.js app
pnpm dev                     # Starts on localhost:3000

# Envio indexer (separate terminal)
cd indexer
pnpm dev                     # Starts indexer + Hasura on localhost:8080
```

Hasura console: http://localhost:8080/console (admin secret: `testing`)

---

## Current Implementation Status

**Completed:**
- Envio indexer for Monad testnet ERC20 transfers
- /api/trades endpoint with Farcaster enrichment
- FeedView with real data, filters, auto-refresh

**Pending:**
- Deploy indexer to Envio hosted service
- Real-time webhook from Envio
- Signal matcher (trades → social graph → notifications)
- Push notifications via Neynar

See `memories/architecture/arch-implementation-status.md` for full details.

---

## Reference Docs
- **Product:** [docs/idea.md](docs/idea.md)
- **Monad:** [docs/monad.md](docs/monad.md)
- **Neynar:** [docs/neynar.md](docs/neynar.md)
- **Farcaster Mini App:** [docs/farcaster.md](docs/farcaster.md)
- **Envio:** [docs/envio/](docs/envio/)
- **Wagmi:** [docs/wagmi.md](docs/wagmi.md)
- **Viem:** [docs/viem.md](docs/viem.md)
