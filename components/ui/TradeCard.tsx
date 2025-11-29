'use client'

import { sdk } from '@farcaster/miniapp-sdk'

export type Trade = {
  id: string
  type: 'buy' | 'sell' | 'transfer'
  trader: {
    fid: number
    username: string
    displayName: string
    pfpUrl?: string
  }
  token: {
    symbol: string
    name: string
    address: string
    logoUrl?: string
  }
  amount: string
  rawAmount?: string
  amountUsd?: string
  timestamp: Date
  txHash: string
  toAddress?: string
}

type TradeCardProps = {
  trade: Trade
  index?: number
}

export function TradeCard({ trade, index = 0 }: TradeCardProps) {
  const isBuy = trade.type === 'buy'
  const isSell = trade.type === 'sell'
  const timeAgo = getTimeAgo(trade.timestamp)

  const handleViewProfile = () => {
    sdk.actions.viewProfile({ fid: trade.trader.fid })
  }

  const handleCopyTrade = () => {
    if (isBuy) {
      // For buys: user wants to buy the same token
      sdk.actions.swapToken({
        buyToken: trade.token.address as `0x${string}`,
      })
    } else if (isSell) {
      // For sells: user wants to sell the same token
      sdk.actions.swapToken({
        sellToken: trade.token.address as `0x${string}`,
      })
    } else if (trade.toAddress) {
      // For transfers: open send form with same token and recipient
      // Using CAIP-19 format for Monad mainnet (chain ID 143)
      const caip19Token = `eip155:143/erc20:${trade.token.address}`
      sdk.actions.sendToken({
        token: caip19Token,
        amount: trade.rawAmount,
        recipientAddress: trade.toAddress as `0x${string}`,
      })
    }
  }

  return (
    <div
      className={`glass-card p-4 opacity-0 animate-fade-in-up stagger-${Math.min(index + 1, 5)}`}
    >
      {/* Header: Trader info + timestamp */}
      <div className="flex items-start justify-between mb-3">
        <button
          onClick={handleViewProfile}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          {trade.trader.pfpUrl ? (
            <img
              src={trade.trader.pfpUrl}
              alt={trade.trader.displayName}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-bg-elevated flex items-center justify-center">
              <span className="text-sm font-bold text-monad-purple">
                {trade.trader.displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="text-left">
            <p className="font-semibold text-text-primary text-sm">
              {trade.trader.displayName}
            </p>
            <p className="text-text-muted text-xs font-mono">
              @{trade.trader.username}
            </p>
          </div>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-text-muted text-xs">{timeAgo}</span>
          <div className="live-dot" />
        </div>
      </div>

      {/* Trade action */}
      <div className="flex items-center gap-3 mb-4">
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
            isBuy ? 'signal-badge-buy' : isSell ? 'signal-badge-sell' : 'signal-badge-transfer'
          }`}
        >
          {trade.type}
        </span>

        <div className="flex items-center gap-2">
          {trade.token.logoUrl ? (
            <img
              src={trade.token.logoUrl}
              alt={trade.token.symbol}
              className="w-6 h-6 rounded-full"
            />
          ) : (
            <div className="token-logo text-[10px]">
              {trade.token.symbol.slice(0, 2)}
            </div>
          )}
          <span className="font-display text-lg">{trade.token.symbol}</span>
        </div>
      </div>

      {/* Amount */}
      <div className="bg-bg-secondary rounded-xl p-3 mb-4">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="font-mono text-xl font-bold text-text-primary">
              {formatAmount(trade.amount)} {trade.token.symbol}
            </p>
            {trade.amountUsd && (
              <p className="font-mono text-sm text-text-muted">
                ≈ ${trade.amountUsd}
              </p>
            )}
          </div>
          <span className={`text-2xl ${isBuy ? 'signal-buy' : isSell ? 'signal-sell' : 'signal-transfer'}`}>
            {isBuy ? '↗' : isSell ? '↘' : '→'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={handleCopyTrade} className="btn-primary flex-1 text-sm py-3">
          Copy
        </button>
        <button
          onClick={() =>
            sdk.actions.openUrl(
              `https://testnet.monadexplorer.com/tx/${trade.txHash}`
            )
          }
          className="btn-secondary px-4 py-3"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15,3 21,3 21,9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
  return `${Math.floor(seconds / 86400)}d`
}

function formatAmount(amount: string): string {
  const num = Number.parseFloat(amount)
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`
  return num.toFixed(2)
}
