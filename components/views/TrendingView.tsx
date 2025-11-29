'use client'

import { sdk } from '@farcaster/miniapp-sdk'

type TrendingToken = {
  rank: number
  symbol: string
  name: string
  address: string
  logoUrl?: string
  buyCount: number
  sellCount: number
  netFlow: 'positive' | 'negative'
  volume: string
  followersTrading: number
}

const MOCK_TRENDING: TrendingToken[] = [
  {
    rank: 1,
    symbol: 'MONAD',
    name: 'Monad Token',
    address: '0x0000000000000000000000000000000000000001',
    buyCount: 156,
    sellCount: 23,
    netFlow: 'positive',
    volume: '2.4M',
    followersTrading: 12,
  },
  {
    rank: 2,
    symbol: 'WETH',
    name: 'Wrapped ETH',
    address: '0x0000000000000000000000000000000000000002',
    buyCount: 89,
    sellCount: 45,
    netFlow: 'positive',
    volume: '890K',
    followersTrading: 8,
  },
  {
    rank: 3,
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0x0000000000000000000000000000000000000003',
    buyCount: 34,
    sellCount: 67,
    netFlow: 'negative',
    volume: '450K',
    followersTrading: 5,
  },
  {
    rank: 4,
    symbol: 'PEPE',
    name: 'Pepe Token',
    address: '0x0000000000000000000000000000000000000004',
    buyCount: 78,
    sellCount: 12,
    netFlow: 'positive',
    volume: '320K',
    followersTrading: 3,
  },
]

export function TrendingView() {
  return (
    <div className="flex flex-col gap-4 p-4 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between opacity-0 animate-fade-in-up">
        <div>
          <h2 className="font-display text-xl">Trending in your network</h2>
          <p className="text-text-muted text-sm">What people you follow are trading</p>
        </div>
        <div className="flex items-center gap-1.5 text-text-muted">
          <span className="text-xs font-mono">24H</span>
        </div>
      </div>

      {/* Token list */}
      <div className="flex flex-col gap-2">
        {MOCK_TRENDING.map((token, index) => (
          <TrendingTokenRow key={token.address} token={token} index={index} />
        ))}
      </div>

      {/* Network insights */}
      <div className="glass-card-glow p-4 mt-2 opacity-0 animate-fade-in-up stagger-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-monad-purple/20 flex items-center justify-center">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-monad-purple"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <p className="font-semibold">Network Insight</p>
            <p className="text-text-muted text-sm">Based on 47 traders you follow</p>
          </div>
        </div>
        <p className="text-text-secondary text-sm leading-relaxed">
          <span className="text-signal-buy font-semibold">12 people</span> you follow bought
          MONAD in the last hour. Most active: @horsefacts, @vitalik.eth
        </p>
      </div>
    </div>
  )
}

function TrendingTokenRow({ token, index }: { token: TrendingToken; index: number }) {
  const isPositive = token.netFlow === 'positive'

  return (
    <button
      onClick={() => sdk.actions.viewToken({ token: token.address as `0x${string}` })}
      className={`glass-card p-4 flex items-center gap-4 hover:border-border-active transition-colors opacity-0 animate-fade-in-up stagger-${Math.min(index + 1, 5)}`}
    >
      {/* Rank */}
      <div className="w-8 h-8 rounded-lg bg-bg-elevated flex items-center justify-center">
        <span className="font-mono font-bold text-sm text-text-secondary">
          #{token.rank}
        </span>
      </div>

      {/* Token info */}
      <div className="flex items-center gap-3 flex-1">
        {token.logoUrl ? (
          <img
            src={token.logoUrl}
            alt={token.symbol}
            className="w-10 h-10 rounded-full"
          />
        ) : (
          <div className="token-logo w-10 h-10 text-sm">
            {token.symbol.slice(0, 2)}
          </div>
        )}
        <div className="text-left">
          <p className="font-semibold">{token.symbol}</p>
          <p className="text-text-muted text-xs">{token.followersTrading} following</p>
        </div>
      </div>

      {/* Buy/Sell counts */}
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-signal-buy">{token.buyCount}</span>
            <span className="text-text-muted">/</span>
            <span className="font-mono text-sm text-signal-sell">{token.sellCount}</span>
          </div>
          <p className="text-text-muted text-xs">${token.volume}</p>
        </div>

        {/* Flow indicator */}
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isPositive ? 'bg-signal-buy-dim' : 'bg-signal-sell-dim'
          }`}
        >
          <span className={`text-lg ${isPositive ? 'text-signal-buy' : 'text-signal-sell'}`}>
            {isPositive ? '↗' : '↘'}
          </span>
        </div>
      </div>
    </button>
  )
}
