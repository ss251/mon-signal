'use client'

import { useEffect, useState } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'
import type { Trade } from './TradeCard'

type SignalDetailModalProps = {
  signal: Trade | null
  onClose: () => void
}

export function SignalDetailModal({ signal, onClose }: SignalDetailModalProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    if (signal) {
      // Slight delay for mount animation
      requestAnimationFrame(() => {
        setIsVisible(true)
      })
    }
  }, [signal])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsVisible(false)
      setIsClosing(false)
      onClose()
    }, 300)
  }

  const handleCopyTrade = async () => {
    if (!signal) return

    // Build CAIP-19 asset ID for the token
    // Format: eip155:{chainId}/erc20:{tokenAddress}
    // Monad Testnet chainId is 10143, Monad Mainnet is 143
    const chainId = 143 // Monad Mainnet
    const tokenAssetId = `eip155:${chainId}/erc20:${signal.token.address}`

    try {
      if (signal.type === 'buy') {
        // User wants to buy the same token the trader bought
        await sdk.actions.swapToken({
          buyToken: tokenAssetId,
        })
      } else {
        // User wants to sell the same token the trader sold
        await sdk.actions.swapToken({
          sellToken: tokenAssetId,
        })
      }
    } catch (error) {
      console.error('Failed to open swap:', error)
    }
  }

  const handleViewProfile = () => {
    if (!signal) return
    sdk.actions.viewProfile({ fid: signal.trader.fid })
  }

  const handleViewTx = () => {
    if (!signal) return
    sdk.actions.openUrl(`https://testnet.monadexplorer.com/tx/${signal.txHash}`)
  }

  if (!signal) return null

  const isBuy = signal.type === 'buy'
  const timeAgo = getTimeAgo(signal.timestamp)

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 transition-all duration-300 ${
          isVisible && !isClosing
            ? 'bg-black/70 backdrop-blur-sm'
            : 'bg-black/0 backdrop-blur-none'
        }`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 transition-all duration-300 ease-out ${
          isVisible && !isClosing
            ? 'translate-y-0 opacity-100'
            : 'translate-y-full opacity-0'
        }`}
      >
        <div className="relative mx-auto max-w-lg">
          {/* Glow effect behind modal */}
          <div
            className={`absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl transition-opacity duration-500 ${
              isBuy ? 'bg-signal-buy/20' : 'bg-signal-sell/20'
            } ${isVisible && !isClosing ? 'opacity-100' : 'opacity-0'}`}
          />

          {/* Modal content */}
          <div className="relative bg-bg-primary border-t border-x border-border-subtle rounded-t-3xl overflow-hidden">
            {/* Decorative top border glow */}
            <div
              className={`absolute top-0 left-0 right-0 h-px ${
                isBuy
                  ? 'bg-gradient-to-r from-transparent via-signal-buy to-transparent'
                  : 'bg-gradient-to-r from-transparent via-signal-sell to-transparent'
              }`}
            />

            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-text-muted/30" />
            </div>

            {/* Header with signal type */}
            <div className="px-6 pb-4">
              <div className="flex items-center justify-between mb-6">
                <div
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                    isBuy ? 'bg-signal-buy/10' : 'bg-signal-sell/10'
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isBuy ? 'bg-signal-buy' : 'bg-signal-sell'
                    } animate-pulse`}
                  />
                  <span
                    className={`font-display text-sm uppercase tracking-widest ${
                      isBuy ? 'text-signal-buy' : 'text-signal-sell'
                    }`}
                  >
                    {isBuy ? 'Buy Signal' : 'Sell Signal'}
                  </span>
                </div>

                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full bg-bg-elevated flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Trader info */}
              <button
                onClick={handleViewProfile}
                className="flex items-center gap-4 mb-6 group"
              >
                <div className="relative">
                  {signal.trader.pfpUrl ? (
                    <img
                      src={signal.trader.pfpUrl}
                      alt={signal.trader.displayName}
                      className="w-14 h-14 rounded-full object-cover ring-2 ring-border-subtle group-hover:ring-monad-purple transition-all"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-bg-elevated flex items-center justify-center ring-2 ring-border-subtle group-hover:ring-monad-purple transition-all">
                      <span className="text-lg font-bold text-monad-purple">
                        {signal.trader.displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  {/* Online indicator */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-bg-primary flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-signal-buy" />
                  </div>
                </div>

                <div className="text-left">
                  <p className="font-display text-lg text-text-primary group-hover:text-monad-purple transition-colors">
                    {signal.trader.displayName}
                  </p>
                  <p className="font-mono text-sm text-text-muted">
                    @{signal.trader.username}
                  </p>
                </div>

                <svg
                  className="ml-auto text-text-muted group-hover:text-monad-purple transition-colors"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>

              {/* Token & Amount - The hero section */}
              <div className="relative rounded-2xl bg-gradient-to-br from-bg-secondary to-bg-elevated p-5 mb-6 overflow-hidden">
                {/* Subtle pattern overlay */}
                <div className="absolute inset-0 opacity-5">
                  <svg width="100%" height="100%">
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" />
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>
                </div>

                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    {signal.token.logoUrl ? (
                      <img
                        src={signal.token.logoUrl}
                        alt={signal.token.symbol}
                        className="w-12 h-12 rounded-full ring-2 ring-border-subtle"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-monad-purple/20 flex items-center justify-center ring-2 ring-monad-purple/30">
                        <span className="font-display text-sm text-monad-purple">
                          {signal.token.symbol.slice(0, 2)}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-display text-2xl text-text-primary">
                        {signal.token.symbol}
                      </p>
                      <p className="text-xs text-text-muted font-mono">
                        {signal.token.address.slice(0, 6)}...{signal.token.address.slice(-4)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
                        Amount
                      </p>
                      <p className="font-mono text-3xl font-bold text-text-primary">
                        {formatAmount(signal.amount)}
                      </p>
                      {signal.amountUsd && (
                        <p className="font-mono text-sm text-text-muted mt-1">
                          ≈ ${signal.amountUsd}
                        </p>
                      )}
                    </div>
                    <div
                      className={`text-6xl font-display ${
                        isBuy ? 'text-signal-buy' : 'text-signal-sell'
                      }`}
                    >
                      {isBuy ? '↗' : '↘'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Timestamp & Tx info */}
              <div className="flex items-center justify-between text-xs text-text-muted mb-6">
                <div className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>{timeAgo}</span>
                </div>
                <button
                  onClick={handleViewTx}
                  className="flex items-center gap-1.5 font-mono hover:text-monad-purple transition-colors"
                >
                  <span>{signal.txHash.slice(0, 10)}...</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15,3 21,3 21,9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </button>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pb-6">
                <button
                  onClick={handleCopyTrade}
                  className={`flex-1 py-4 rounded-xl font-display text-base transition-all ${
                    isBuy
                      ? 'bg-signal-buy text-bg-primary hover:shadow-lg hover:shadow-signal-buy/20'
                      : 'bg-signal-sell text-white hover:shadow-lg hover:shadow-signal-sell/20'
                  }`}
                >
                  Copy Trade
                </button>
                <button
                  onClick={handleViewTx}
                  className="px-5 py-4 rounded-xl bg-bg-elevated border border-border-subtle text-text-secondary hover:border-monad-purple hover:text-text-primary transition-all"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15,3 21,3 21,9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Safe area padding for iPhone */}
            <div className="h-[env(safe-area-inset-bottom)]" />
          </div>
        </div>
      </div>
    </>
  )
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

function formatAmount(amount: string): string {
  const num = Number.parseFloat(amount)
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`
  return num.toFixed(4)
}
