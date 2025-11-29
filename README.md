# Mon Signal

**Social Signals for Degens** — Turn your Farcaster feed into alpha.

Mon Signal is a Farcaster Mini App that delivers real-time trading signals from Farcaster on Monad. When someone you follow makes a move — buy, sell, or swap — you get notified instantly.

> Farcaster is your signal. No paid groups. Just trades that actually matter to you.

## Features

- **Watchlist** — Select which Farcaster accounts you want to track, with persistence across sessions
- **Real-time Feed** — See ERC20 trades from your watchlist, enriched with Farcaster profiles
- **Push Notifications** — Get notified when a watched wallet makes a trade (with rate limiting)
- **Signal Detail View** — Deep-link from notifications to see trade details
- **Copy Trade** — One-tap action to open a swap with the same token

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Monad Chain   │────▶│  Envio HyperSync │────▶│  Hasura GraphQL │
│  (ERC20 events) │     │    (Indexer)     │     │    (Database)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                          │
                        ┌─────────────────────────────────┘
                        ▼
              ┌──────────────────┐     ┌─────────────────┐
              │   Next.js App    │────▶│     Neynar      │
              │   (API Routes)   │     │ (Farcaster API) │
              └──────────────────┘     └─────────────────┘
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
    ┌──────────┐  ┌──────────┐  ┌───────────────┐
    │  Redis   │  │  Client  │  │ Push Notifs   │
    │(Upstash) │  │   App    │  │ (via Neynar)  │
    └──────────┘  └──────────┘  └───────────────┘
```

### Data Flow

1. **Indexing**: Envio HyperIndex monitors all ERC20 `Transfer` events on Monad (wildcard mode)
2. **Storage**: Trades are stored in Hasura/PostgreSQL with GraphQL access
3. **Enrichment**: When trades are fetched, wallet addresses are mapped to Farcaster users via Neynar
4. **Notifications**: The indexer calls a webhook for recent trades, which checks Redis for watchers and sends push notifications
5. **Display**: The Mini App shows trades from watchlisted Farcaster accounts with filtering and detail views

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, TailwindCSS, React Query |
| Blockchain | Monad (Chain ID: 143) |
| Indexer | Envio HyperIndex with HyperSync |
| Farcaster | Neynar API |
| Database | Hasura + PostgreSQL (via Envio) |
| Cache/State | Upstash Redis |
| Smart Contracts | Foundry (for test token) |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10+
- Docker (for local Envio indexer)

### Environment Variables

Create `.env.local` in the root directory:

```env
# App URL (use ngrok/cloudflared for local development)
NEXT_PUBLIC_URL=https://your-app.ngrok.app

# Neynar API for Farcaster integration
NEYNAR_API_KEY=your-neynar-api-key

# Upstash Redis for watchlist persistence
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Envio GraphQL endpoint
ENVIO_GRAPHQL_URL=http://localhost:8080/v1/graphql
ENVIO_ADMIN_SECRET=testing

# Webhook secret (optional, for production)
WEBHOOK_SECRET=your-webhook-secret
```

For the indexer, create `indexer/.env`:

```env
# Webhook URL for notifications (your app's webhook endpoint)
TRADE_WEBHOOK_URL=https://your-app.ngrok.app/api/webhook/trade
WEBHOOK_SECRET=your-webhook-secret
```

### Running Locally

**1. Start the Next.js app:**

```bash
pnpm install
pnpm dev
```

**2. Start the Envio indexer (in a separate terminal):**

```bash
cd indexer
pnpm install
pnpm dev
```

The indexer will start syncing from Monad and expose a GraphQL endpoint at `http://localhost:8080/v1/graphql`.

**3. Expose your local app for testing:**

```bash
# Using cloudflared
cloudflared tunnel --url http://localhost:3000

# Or using ngrok
ngrok http 3000
```

Update `NEXT_PUBLIC_URL` and `TRADE_WEBHOOK_URL` with the tunnel URL.

**4. Test in Warpcast:**

Open the [Warpcast Mini App Embed tool](https://warpcast.com/~/developers/mini-apps/embed) and enter your tunnel URL.

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/trades` | GET | Fetch trades, optionally filtered by watchlist (`?fid=123`) |
| `/api/watchlist` | GET | Get a user's watchlist (`?fid=123`) |
| `/api/watchlist` | POST | Add/remove from watchlist |
| `/api/webhook/trade` | POST | Receive trade events from indexer |
| `/api/signal` | GET | Get a specific signal by txHash (`?id=0x...`) |

## Limitations

### Native Token Transfers

The indexer only captures **ERC20 Transfer events**. Native MON transfers do not emit events and will not appear in the feed or trigger notifications. Only token contract interactions are indexed.

## Test Token

For development and testing, a simple ERC20 token contract is included:

**MonSignal (MONSIG)** — Deployed on Monad Testnet at:
```
0x1Ee5C0B33438aC921fAe7988E77b9c0aB6f7CE2A
```

The contract includes a `faucet()` function that mints 1000 tokens to the caller, useful for testing the notification flow.

To deploy your own:

```bash
cd contracts
forge build
forge create src/MonSignal.sol:MonSignal \
  --constructor-args 1000000000000000000000000 \
  --rpc-url https://testnet-rpc.monad.xyz \
  --private-key $PRIVATE_KEY
```

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── trades/          # Trade feed endpoint
│   │   ├── watchlist/       # Watchlist management
│   │   ├── webhook/trade/   # Indexer webhook for notifications
│   │   └── signal/          # Signal detail endpoint
│   └── page.tsx             # Main app entry
├── components/
│   ├── views/
│   │   ├── FeedView.tsx     # Trade feed with filters
│   │   └── WatchlistView.tsx # Manage watchlist
│   └── ui/
│       ├── TradeCard.tsx    # Individual trade display
│       └── SignalDetailModal.tsx # Signal deep-link view
├── lib/
│   ├── envio.ts             # GraphQL client for indexer
│   ├── neynar.ts            # Farcaster API client
│   └── redis.ts             # Upstash Redis client
├── indexer/
│   ├── config.yaml          # Envio indexer config
│   ├── schema.graphql       # Trade & Account entities
│   └── src/EventHandlers.ts # ERC20 Transfer handler
└── contracts/
    └── src/MonSignal.sol    # Test ERC20 token
```

## Contributing

Contributions are welcome! Please open an issue or PR.

## License

MIT
