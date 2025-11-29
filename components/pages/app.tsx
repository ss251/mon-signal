'use client'

import { useState } from 'react'
import { useFrame } from '@/components/farcaster-provider'
import { SafeAreaContainer } from '@/components/safe-area-container'
import { Header } from '@/components/ui/Header'
import { BottomNav } from '@/components/ui/BottomNav'
import { FeedView } from '@/components/views/FeedView'
import { WatchlistView } from '@/components/views/WatchlistView'
import { SettingsView } from '@/components/views/SettingsView'

type Tab = 'feed' | 'watchlist' | 'settings'

export default function App() {
  const { context, isLoading, isSDKLoaded } = useFrame()
  const [activeTab, setActiveTab] = useState<Tab>('feed')

  if (isLoading) {
    return (
      <SafeAreaContainer insets={context?.client.safeAreaInsets}>
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <div className="relative">
            {/* Animated logo */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-monad-purple to-monad-purple-dim flex items-center justify-center shadow-glow animate-pulse">
              <svg
                width="40"
                height="40"
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
          </div>
          <p className="mt-6 text-text-secondary animate-pulse">Loading signals...</p>
        </div>
      </SafeAreaContainer>
    )
  }

  if (!isSDKLoaded) {
    return (
      <SafeAreaContainer insets={context?.client.safeAreaInsets}>
        <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 rounded-2xl bg-bg-elevated flex items-center justify-center mb-6">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-text-muted"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1 className="font-display text-2xl mb-3">Open in Farcaster</h1>
          <p className="text-text-secondary max-w-[280px]">
            Mon Signal is a Farcaster Mini App. Open this link in Warpcast or another
            Farcaster client to use it.
          </p>
        </div>
      </SafeAreaContainer>
    )
  }

  return (
    <SafeAreaContainer insets={context?.client.safeAreaInsets}>
      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1 overflow-y-auto hide-scrollbar">
          {activeTab === 'feed' && <FeedView onNavigateToWatchlist={() => setActiveTab('watchlist')} />}
          {activeTab === 'watchlist' && <WatchlistView />}
          {activeTab === 'settings' && <SettingsView />}
        </main>

        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </SafeAreaContainer>
  )
}
