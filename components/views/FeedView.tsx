'use client'

import { useEffect, useState, useCallback } from 'react'
import { TradeCard, type Trade } from '@/components/ui/TradeCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { useFrame } from '@/components/farcaster-provider'
import { sdk } from '@farcaster/miniapp-sdk'
import type { TradeResponse } from '@/app/api/trades/route'

type FilterType = 'all' | 'buys' | 'sells'

export function FeedView() {
  const { context } = useFrame()
  const [trades, setTrades] = useState<Trade[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')
  const [stats, setStats] = useState({ buys: 0, sells: 0, volume: '0' })
  const isSubscribed = true // TODO: Check subscription status

  const fetchTrades = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/trades?limit=50')
      if (!response.ok) {
        throw new Error('Failed to fetch trades')
      }

      const data = await response.json()

      // Transform API response to Trade format
      const transformedTrades: Trade[] = data.trades.map((t: TradeResponse) => ({
        id: t.id,
        type: t.type,
        trader: t.trader || {
          fid: 0,
          username: t.fromAddress.slice(0, 10),
          displayName: `${t.fromAddress.slice(0, 6)}...${t.fromAddress.slice(-4)}`,
        },
        token: t.token,
        amount: t.amount,
        amountUsd: t.amountUsd,
        timestamp: new Date(t.timestamp),
        txHash: t.txHash,
      }))

      setTrades(transformedTrades)

      // Calculate stats
      const buys = transformedTrades.filter((t) => t.type === 'buy').length
      const sells = transformedTrades.filter((t) => t.type === 'sell').length
      setStats({ buys, sells, volume: '$--' })
    } catch (err) {
      console.error('Error fetching trades:', err)
      setError(err instanceof Error ? err.message : 'Failed to load trades')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTrades()
    // Refresh every 30 seconds
    const interval = setInterval(fetchTrades, 30000)
    return () => clearInterval(interval)
  }, [fetchTrades])

  const filteredTrades = trades.filter((trade) => {
    if (filter === 'all') return true
    if (filter === 'buys') return trade.type === 'buy'
    if (filter === 'sells') return trade.type === 'sell'
    return true
  })

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

  if (error) {
    return (
      <EmptyState
        title="Error loading trades"
        description={error}
        action={{
          label: 'Retry',
          onClick: fetchTrades,
        }}
      />
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
          <p className="font-mono text-lg font-bold text-signal-buy">+{stats.buys}</p>
          <p className="text-[10px] text-text-muted uppercase tracking-wider">Buys</p>
        </div>
        <div className="w-px h-8 bg-border-subtle" />
        <div className="text-center">
          <p className="font-mono text-lg font-bold text-signal-sell">-{stats.sells}</p>
          <p className="text-[10px] text-text-muted uppercase tracking-wider">Sells</p>
        </div>
        <div className="w-px h-8 bg-border-subtle" />
        <div className="text-center">
          <p className="font-mono text-lg font-bold text-text-primary">{stats.volume}</p>
          <p className="text-[10px] text-text-muted uppercase tracking-wider">Volume</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="tab-nav opacity-0 animate-fade-in-up stagger-1">
        <button
          className={`tab-item ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={`tab-item ${filter === 'buys' ? 'active' : ''}`}
          onClick={() => setFilter('buys')}
        >
          Buys
        </button>
        <button
          className={`tab-item ${filter === 'sells' ? 'active' : ''}`}
          onClick={() => setFilter('sells')}
        >
          Sells
        </button>
      </div>

      {/* Trade cards */}
      {filteredTrades.map((trade, index) => (
        <TradeCard key={trade.id} trade={trade} index={index + 2} />
      ))}

      {filteredTrades.length === 0 && (
        <EmptyState
          title={`No ${filter} yet`}
          description={`No ${filter === 'buys' ? 'buy' : 'sell'} signals in this batch`}
        />
      )}
    </div>
  )
}
