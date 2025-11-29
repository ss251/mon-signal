import { NextResponse } from 'next/server'
import { getUserFollowing } from '@/lib/neynar'
import { redis, KEYS } from '@/lib/redis'

// Disable caching for this route - always fetch fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

export type FollowingUserResponse = {
  fid: number
  username: string
  displayName: string
  pfpUrl?: string
  wallets: string[]
  isWatching: boolean
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const fidParam = searchParams.get('fid')

    if (!fidParam) {
      return NextResponse.json(
        { error: 'fid parameter is required' },
        { status: 400 }
      )
    }

    const fid = parseInt(fidParam, 10)
    if (isNaN(fid)) {
      return NextResponse.json(
        { error: 'Invalid fid parameter' },
        { status: 400 }
      )
    }

    // Get user's following list from Neynar (fetches all pages)
    const following = await getUserFollowing(fid)

    // Get user's current watchlist from Redis
    const watchlistKey = KEYS.watchlist(fid)
    const watchlist = await redis.smembers(watchlistKey)
    const watchlistSet = new Set(watchlist.map(w => parseInt(String(w), 10)))

    // Transform to response format
    const result: FollowingUserResponse[] = following.map((follower) => {
      const user = follower.user
      const wallets: string[] = []

      // Get verified ETH addresses
      if (user.verified_addresses?.eth_addresses) {
        wallets.push(...user.verified_addresses.eth_addresses.map((a: string) => a.toLowerCase()))
      }

      // Get custody address
      if (user.custody_address) {
        wallets.push(user.custody_address.toLowerCase())
      }

      return {
        fid: user.fid,
        username: user.username,
        displayName: user.display_name || user.username,
        pfpUrl: user.pfp_url,
        wallets,
        isWatching: watchlistSet.has(user.fid),
      }
    })

    // Sort: watching first, then alphabetically
    result.sort((a, b) => {
      if (a.isWatching !== b.isWatching) {
        return a.isWatching ? -1 : 1
      }
      return a.username.localeCompare(b.username)
    })

    return NextResponse.json({
      following: result,
      total: result.length,
      watching: result.filter(u => u.isWatching).length,
    })
  } catch (error) {
    console.error('Error fetching following:', error)
    return NextResponse.json(
      { error: 'Failed to fetch following list' },
      { status: 500 }
    )
  }
}
