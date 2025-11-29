'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useFrame } from '@/components/farcaster-provider'
import Image from 'next/image'
import { sessionCache, CACHE_KEYS } from '@/lib/cache'

type FollowingUser = {
  fid: number
  username: string
  displayName: string
  pfpUrl?: string
  wallets: string[]
  isWatching: boolean
}

const ITEMS_PER_PAGE = 20

export function WatchlistView() {
  const { context } = useFrame()
  const [following, setFollowing] = useState<FollowingUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectAll, setSelectAll] = useState(false)
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const fetchFollowing = useCallback(async () => {
    if (!context?.user?.fid) return

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/following?fid=${context.user.fid}`)
      if (!response.ok) {
        throw new Error('Failed to fetch following list')
      }

      const data = await response.json()
      setFollowing(data.following)

      // Cache the result for optimistic updates
      const cacheKey = CACHE_KEYS.following(context.user.fid)
      sessionCache.set(cacheKey, data.following)

      // Check if all are selected
      const allSelected = data.following.length > 0 && data.following.every((u: FollowingUser) => u.isWatching)
      setSelectAll(allSelected)
    } catch (err) {
      console.error('Error fetching following:', err)
      setError(err instanceof Error ? err.message : 'Failed to load following')
    } finally {
      setIsLoading(false)
    }
  }, [context?.user?.fid])

  useEffect(() => {
    fetchFollowing()
  }, [fetchFollowing])

  // Reset visible count when search changes
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE)
  }, [searchQuery])

  // Keep selectAll in sync with following state
  useEffect(() => {
    if (following.length > 0) {
      const allSelected = following.every((u) => u.isWatching)
      setSelectAll(allSelected)
    }
  }, [following])

  const toggleWatch = async (fid: number) => {
    const user = following.find(u => u.fid === fid)
    if (!user || !context?.user?.fid) return

    const cacheKey = CACHE_KEYS.following(context.user.fid)
    const previousFollowing = [...following]

    // Optimistic update
    const updatedFollowing = following.map(u => u.fid === fid ? { ...u, isWatching: !u.isWatching } : u)
    setFollowing(updatedFollowing)

    try {
      const response = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userFid: context.user.fid,
          targetFid: fid,
          action: user.isWatching ? 'remove' : 'add',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update watchlist')
      }

      // Only cache after successful API response
      sessionCache.set(cacheKey, updatedFollowing)
    } catch (err) {
      console.error('Failed to update watchlist:', err)
      // Revert on error
      setFollowing(previousFollowing)
      sessionCache.invalidate(cacheKey)
    }
  }

  const toggleSelectAll = async () => {
    if (!context?.user?.fid) return

    const newState = !selectAll
    const previousSelectAll = selectAll
    const previousFollowing = [...following]
    const cacheKey = CACHE_KEYS.following(context.user.fid)

    // Optimistic update
    setSelectAll(newState)
    const updatedFollowing = following.map(u => ({ ...u, isWatching: newState }))
    setFollowing(updatedFollowing)

    try {
      const response = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userFid: context.user.fid,
          action: newState ? 'add_all' : 'remove_all',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update watchlist')
      }

      // Only cache after successful API response
      sessionCache.set(cacheKey, updatedFollowing)
    } catch (err) {
      console.error('Failed to update watchlist:', err)
      // Revert on error
      setSelectAll(previousSelectAll)
      setFollowing(previousFollowing)
      sessionCache.invalidate(cacheKey)
    }
  }

  const filteredFollowing = following.filter(user => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      user.username.toLowerCase().includes(query) ||
      user.displayName.toLowerCase().includes(query)
    )
  })

  // Infinite scroll observer
  useEffect(() => {
    const currentRef = loadMoreRef.current
    if (!currentRef) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + ITEMS_PER_PAGE, filteredFollowing.length))
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    )

    observer.observe(currentRef)

    return () => {
      observer.disconnect()
    }
  }, [filteredFollowing.length, visibleCount])

  const watchingCount = following.filter(u => u.isWatching).length

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="glass-card p-4">
          <div className="h-10 bg-bg-elevated rounded-xl animate-pulse mb-4" />
          <div className="grid grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-full bg-bg-elevated animate-pulse" />
                <div className="w-12 h-3 bg-bg-elevated rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-bg-elevated flex items-center justify-center mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-signal-sell">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <p className="text-text-secondary mb-4">{error}</p>
        <button onClick={() => fetchFollowing()} className="btn-secondary">
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-28">
      {/* Header stats */}
      <div className="glass-card p-4 opacity-0 animate-fade-in-up">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-lg">Watchlist</h2>
            <p className="text-text-muted text-sm">
              Select who to get signals from
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-2xl font-bold text-monad-purple">{watchingCount}</p>
            <p className="text-[10px] text-text-muted uppercase tracking-wider">Watching</p>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative mb-4">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search people..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-bg-secondary border border-border-subtle rounded-xl px-4 py-3 pl-12 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-monad-purple/50 focus:border-monad-purple"
          />
        </div>

        {/* Select all toggle */}
        <div className="flex items-center justify-between p-3 bg-bg-secondary rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-monad-purple/20 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-monad-purple">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <p className="font-medium">Watch Everyone</p>
              <p className="text-xs text-text-muted">{following.length} people you follow</p>
            </div>
          </div>
          <button
            onClick={toggleSelectAll}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
              selectAll ? 'bg-monad-purple' : 'bg-bg-elevated'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                selectAll ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Following grid */}
      <div className="glass-card p-4 opacity-0 animate-fade-in-up stagger-1">
        <div className="flex items-center justify-between mb-4">
          <p className="text-text-secondary text-sm">
            {filteredFollowing.length} {filteredFollowing.length === 1 ? 'person' : 'people'}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-monad-purple"
            >
              Clear search
            </button>
          )}
        </div>

        {filteredFollowing.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-text-muted">
              {searchQuery ? 'No matches found' : 'You\'re not following anyone yet'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-4">
              {filteredFollowing.slice(0, visibleCount).map((user, index) => (
                <button
                  key={user.fid}
                  onClick={() => toggleWatch(user.fid)}
                  className={`group flex flex-col items-center gap-2 p-2 rounded-xl transition-all duration-200 opacity-0 animate-fade-in-up ${
                    user.isWatching
                      ? 'bg-monad-purple/10 ring-2 ring-monad-purple/50'
                      : 'hover:bg-bg-elevated'
                  }`}
                  style={{ animationDelay: `${(index % 12) * 0.03}s` }}
                >
                  <div className="relative">
                    <div className={`w-14 h-14 rounded-full overflow-hidden border-2 transition-colors duration-200 ${
                      user.isWatching ? 'border-monad-purple' : 'border-transparent'
                    }`}>
                      {user.pfpUrl ? (
                        <Image
                          src={user.pfpUrl}
                          alt={user.username}
                          width={56}
                          height={56}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-bg-elevated flex items-center justify-center text-text-muted font-bold">
                          {user.username.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    {user.isWatching && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-monad-purple flex items-center justify-center">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <span className={`text-xs truncate max-w-full transition-colors duration-200 ${
                    user.isWatching ? 'text-text-primary font-medium' : 'text-text-secondary'
                  }`}>
                    @{user.username}
                  </span>
                </button>
              ))}
            </div>
            {/* Load more trigger */}
            {visibleCount < filteredFollowing.length && (
              <div ref={loadMoreRef} className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-monad-purple border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Info card */}
      <div className="glass-card p-4 opacity-0 animate-fade-in-up stagger-2">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-signal-buy/10 flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-signal-buy">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-sm mb-1">Get notified instantly</p>
            <p className="text-xs text-text-muted leading-relaxed">
              When anyone on your watchlist makes a trade on Monad, you&apos;ll get a push notification with the details.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
