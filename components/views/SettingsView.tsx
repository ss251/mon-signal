'use client'

import { useState } from 'react'
import { useFrame } from '@/components/farcaster-provider'
import { sdk } from '@farcaster/miniapp-sdk'

export function SettingsView() {
  const { context } = useFrame()
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [minTradeSize, setMinTradeSize] = useState('100')

  const handleToggleNotifications = async () => {
    if (notificationsEnabled) {
      // Would disable notifications
      setNotificationsEnabled(false)
    } else {
      // Prompt to add/enable
      await sdk.actions.addFrame()
      setNotificationsEnabled(true)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-28">
      {/* Profile section */}
      <div className="glass-card p-4 opacity-0 animate-fade-in-up">
        <div className="flex items-center gap-4">
          {context?.user?.pfpUrl ? (
            <img
              src={context.user.pfpUrl}
              alt={context.user.displayName}
              className="w-16 h-16 rounded-full object-cover ring-2 ring-monad-purple/30"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-bg-elevated flex items-center justify-center ring-2 ring-monad-purple/30">
              <span className="text-2xl font-bold text-monad-purple">
                {context?.user?.displayName?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1">
            <p className="font-display text-lg">{context?.user?.displayName}</p>
            <p className="text-text-muted text-sm font-mono">@{context?.user?.username}</p>
            <p className="text-text-muted text-xs mt-1">FID: {context?.user?.fid}</p>
          </div>
          <button
            onClick={() =>
              context?.user?.fid &&
              sdk.actions.viewProfile({ fid: context.user.fid })
            }
            className="btn-secondary px-3 py-2 text-sm"
          >
            View
          </button>
        </div>
      </div>

      {/* Notifications section */}
      <div className="glass-card p-4 opacity-0 animate-fade-in-up stagger-1">
        <h3 className="font-display text-lg mb-4">Notifications</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Signal Alerts</p>
              <p className="text-text-muted text-sm">
                Get notified when people you follow trade
              </p>
            </div>
            <button
              onClick={handleToggleNotifications}
              className={`w-12 h-7 rounded-full transition-colors relative ${
                notificationsEnabled ? 'bg-monad-purple' : 'bg-bg-elevated'
              }`}
            >
              <div
                className={`absolute w-5 h-5 rounded-full bg-white top-1 transition-transform ${
                  notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="divider" />

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium">Minimum Trade Size</p>
              <span className="font-mono text-sm text-monad-purple">${minTradeSize}</span>
            </div>
            <p className="text-text-muted text-sm mb-3">
              Only notify for trades above this value
            </p>
            <input
              type="range"
              min="0"
              max="10000"
              step="100"
              value={minTradeSize}
              onChange={(e) => setMinTradeSize(e.target.value)}
              className="w-full h-2 bg-bg-elevated rounded-lg appearance-none cursor-pointer accent-monad-purple"
            />
            <div className="flex justify-between text-xs text-text-muted mt-1">
              <span>$0</span>
              <span>$10K</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter section */}
      <div className="glass-card p-4 opacity-0 animate-fade-in-up stagger-2">
        <h3 className="font-display text-lg mb-4">Signal Filters</h3>

        <div className="space-y-3">
          <FilterToggle label="Buy signals" defaultOn />
          <FilterToggle label="Sell signals" defaultOn />
          <FilterToggle label="Whale alerts ($10K+)" defaultOn />
          <FilterToggle label="New token listings" defaultOn={false} />
        </div>
      </div>

      {/* About section */}
      <div className="glass-card p-4 opacity-0 animate-fade-in-up stagger-3">
        <h3 className="font-display text-lg mb-4">About</h3>

        <div className="space-y-3">
          <button
            onClick={() =>
              sdk.actions.openUrl('https://monad.xyz')
            }
            className="w-full flex items-center justify-between p-3 bg-bg-secondary rounded-xl hover:bg-bg-elevated transition-colors"
          >
            <span className="text-sm">Powered by Monad</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-text-muted"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15,3 21,3 21,9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </button>

          <button
            onClick={() =>
              sdk.actions.composeCast({
                text: 'Just discovered @monsignal - get trading signals from your Farcaster network on Monad!',
              })
            }
            className="w-full flex items-center justify-between p-3 bg-bg-secondary rounded-xl hover:bg-bg-elevated transition-colors"
          >
            <span className="text-sm">Share Mon Signal</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-text-muted"
            >
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </button>
        </div>

        <p className="text-text-muted text-xs text-center mt-4">
          Mon Signal v1.0.0 • Built on Farcaster
        </p>
      </div>
    </div>
  )
}

function FilterToggle({
  label,
  defaultOn = true,
}: {
  label: string
  defaultOn?: boolean
}) {
  const [enabled, setEnabled] = useState(defaultOn)

  return (
    <div className="flex items-center justify-between p-3 bg-bg-secondary rounded-xl">
      <span className="text-sm">{label}</span>
      <button
        onClick={() => setEnabled(!enabled)}
        className={`w-10 h-6 rounded-full transition-colors relative ${
          enabled ? 'bg-monad-purple' : 'bg-bg-elevated'
        }`}
      >
        <div
          className={`absolute w-4 h-4 rounded-full bg-white top-1 transition-transform ${
            enabled ? 'translate-x-5' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}
