'use client'

import { useFrame } from '@/components/farcaster-provider'

export function Header() {
  const { context } = useFrame()

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-bg-primary/80 border-b border-border-subtle">
      <div className="px-4 py-3 flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-monad-purple to-monad-purple-dim flex items-center justify-center shadow-glow">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <div>
            <h1 className="font-display text-lg leading-tight">Mon Signal</h1>
            <div className="flex items-center gap-1.5">
              <div className="live-dot w-[6px] h-[6px]" />
              <span className="text-xs text-text-muted font-mono">LIVE</span>
            </div>
          </div>
        </div>

        {/* User Avatar */}
        {context?.user && (
          <button className="relative">
            {context.user.pfpUrl ? (
              <img
                src={context.user.pfpUrl}
                alt={context.user.displayName}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-monad-purple/30"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-bg-elevated flex items-center justify-center ring-2 ring-monad-purple/30">
                <span className="text-sm font-bold text-monad-purple">
                  {context.user.displayName?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </button>
        )}
      </div>
    </header>
  )
}
