'use client'

import { TradeCard, type Trade } from '@/components/ui/TradeCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { useFrame } from '@/components/farcaster-provider'
import { sdk } from '@farcaster/miniapp-sdk'

// Mock data for demo - will be replaced with real data from API
const MOCK_TRADES: Trade[] = [
  {
    id: '1',
    type: 'buy',
    trader: {
      fid: 3621,
      username: 'horsefacts.eth',
      displayName: 'horsefacts',
      pfpUrl: 'https://i.imgur.com/kVXj9Zz.jpg',
    },
    token: {
      symbol: 'MONAD',
      name: 'Monad Token',
      address: '0x0000000000000000000000000000000000000001',
    },
    amount: '50000',
    amountUsd: '2,450.00',
    timestamp: new Date(Date.now() - 1000 * 60 * 2), // 2 min ago
    txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  },
  {
    id: '2',
    type: 'sell',
    trader: {
      fid: 194,
      username: 'rish',
      displayName: 'rish',
      pfpUrl: 'https://i.imgur.com/Y3p7JQT.jpg',
    },
    token: {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0x0000000000000000000000000000000000000002',
    },
    amount: '10000',
    amountUsd: '10,000.00',
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 min ago
    txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  },
  {
    id: '3',
    type: 'buy',
    trader: {
      fid: 5650,
      username: 'vitalik.eth',
      displayName: 'Vitalik Buterin',
      pfpUrl: 'https://i.imgur.com/Qe8XQWV.jpg',
    },
    token: {
      symbol: 'WETH',
      name: 'Wrapped ETH',
      address: '0x0000000000000000000000000000000000000003',
    },
    amount: '125.5',
    amountUsd: '312,500.00',
    timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 min ago
    txHash: '0x567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234',
  },
]

export function FeedView() {
  const { context } = useFrame()
  // TODO: Replace with real data fetch
  const trades = MOCK_TRADES
  const isLoading = false
  const isSubscribed = true // TODO: Check subscription status

  if (!isSubscribed) {
    return (
      <EmptyState
        title="Enable Signals"
        description="Subscribe to see trading signals from people you follow on Farcaster"
        action={{
          label: 'Enable Signals',
          onClick: () => sdk.actions.addFrame(),
        }}
      />
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card p-4 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-bg-elevated" />
              <div className="space-y-2">
                <div className="w-24 h-4 bg-bg-elevated rounded" />
                <div className="w-16 h-3 bg-bg-elevated rounded" />
              </div>
            </div>
            <div className="w-full h-20 bg-bg-elevated rounded-xl" />
          </div>
        ))}
      </div>
    )
  }

  if (trades.length === 0) {
    return (
      <EmptyState
        title="No signals yet"
        description="When people you follow make trades on Monad, you'll see them here"
      />
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-28">
      {/* Stats bar */}
      <div className="glass-card p-3 flex items-center justify-around opacity-0 animate-fade-in-up">
        <div className="text-center">
          <p className="font-mono text-lg font-bold text-signal-buy">+24</p>
          <p className="text-[10px] text-text-muted uppercase tracking-wider">Buys</p>
        </div>
        <div className="w-px h-8 bg-border-subtle" />
        <div className="text-center">
          <p className="font-mono text-lg font-bold text-signal-sell">-8</p>
          <p className="text-[10px] text-text-muted uppercase tracking-wider">Sells</p>
        </div>
        <div className="w-px h-8 bg-border-subtle" />
        <div className="text-center">
          <p className="font-mono text-lg font-bold text-text-primary">$1.2M</p>
          <p className="text-[10px] text-text-muted uppercase tracking-wider">Volume</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="tab-nav opacity-0 animate-fade-in-up stagger-1">
        <button className="tab-item active">All</button>
        <button className="tab-item">Buys</button>
        <button className="tab-item">Sells</button>
      </div>

      {/* Trade cards */}
      {trades.map((trade, index) => (
        <TradeCard key={trade.id} trade={trade} index={index + 2} />
      ))}
    </div>
  )
}
