import { NextResponse } from 'next/server'
import { redis, KEYS, isRedisConfigured } from '@/lib/redis'
import { getUserFollowing } from '@/lib/neynar'

// Disable caching for this route
export const dynamic = 'force-dynamic'
export const revalidate = 0

type WatchlistAction = 'add' | 'remove' | 'add_all' | 'remove_all'

type WatchlistRequest = {
  userFid: number
  targetFid?: number
  action: WatchlistAction
}

export async function POST(request: Request) {
  try {
    if (!isRedisConfigured) {
      console.error('Redis not configured - watchlist changes will not persist')
      return NextResponse.json(
        { error: 'Storage not configured. Please set up Redis.' },
        { status: 503 }
      )
    }

    const body: WatchlistRequest = await request.json()
    const { userFid, targetFid, action } = body

    if (!userFid) {
      return NextResponse.json(
        { error: 'userFid is required' },
        { status: 400 }
      )
    }

    const watchlistKey = KEYS.watchlist(userFid)
    console.log(`[Watchlist] ${action} for user ${userFid}, target: ${targetFid}, key: ${watchlistKey}`)

    switch (action) {
      case 'add': {
        if (!targetFid) {
          return NextResponse.json(
            { error: 'targetFid is required for add action' },
            { status: 400 }
          )
        }
        await redis.sadd(watchlistKey, targetFid)

        // Also update the reverse lookup for notifications
        // Get target's wallets and add to watching index
        const following = await getUserFollowing(userFid)
        const target = following.find(f => f.user.fid === targetFid)
        if (target) {
          const wallets: string[] = []
          if (target.user.verified_addresses?.eth_addresses) {
            wallets.push(...target.user.verified_addresses.eth_addresses)
          }
          if (target.user.custody_address) {
            wallets.push(target.user.custody_address)
          }
          for (const wallet of wallets) {
            await redis.sadd(KEYS.watching(wallet), userFid)
          }
        }

        return NextResponse.json({ success: true, action: 'added', targetFid })
      }

      case 'remove': {
        if (!targetFid) {
          return NextResponse.json(
            { error: 'targetFid is required for remove action' },
            { status: 400 }
          )
        }
        await redis.srem(watchlistKey, targetFid)

        // Remove from reverse lookup
        const following = await getUserFollowing(userFid)
        const target = following.find(f => f.user.fid === targetFid)
        if (target) {
          const wallets: string[] = []
          if (target.user.verified_addresses?.eth_addresses) {
            wallets.push(...target.user.verified_addresses.eth_addresses)
          }
          if (target.user.custody_address) {
            wallets.push(target.user.custody_address)
          }
          for (const wallet of wallets) {
            await redis.srem(KEYS.watching(wallet), userFid)
          }
        }

        return NextResponse.json({ success: true, action: 'removed', targetFid })
      }

      case 'add_all': {
        // Get all following and add to watchlist
        const following = await getUserFollowing(userFid)
        const fids = following.map(f => f.user.fid)

        if (fids.length > 0) {
          // Add each fid individually to avoid spread issues
          for (const targetFid of fids) {
            await redis.sadd(watchlistKey, targetFid)
          }

          // Update reverse lookup for all
          for (const follower of following) {
            const wallets: string[] = []
            if (follower.user.verified_addresses?.eth_addresses) {
              wallets.push(...follower.user.verified_addresses.eth_addresses)
            }
            if (follower.user.custody_address) {
              wallets.push(follower.user.custody_address)
            }
            for (const wallet of wallets) {
              await redis.sadd(KEYS.watching(wallet), userFid)
            }
          }
        }

        return NextResponse.json({ success: true, action: 'added_all', count: fids.length })
      }

      case 'remove_all': {
        // Clear the watchlist
        await redis.del(watchlistKey)

        // Clear reverse lookups - get following first
        const following = await getUserFollowing(userFid)
        for (const follower of following) {
          const wallets: string[] = []
          if (follower.user.verified_addresses?.eth_addresses) {
            wallets.push(...follower.user.verified_addresses.eth_addresses)
          }
          if (follower.user.custody_address) {
            wallets.push(follower.user.custody_address)
          }
          for (const wallet of wallets) {
            await redis.srem(KEYS.watching(wallet), userFid)
          }
        }

        return NextResponse.json({ success: true, action: 'removed_all' })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error updating watchlist:', error)
    return NextResponse.json(
      { error: 'Failed to update watchlist' },
      { status: 500 }
    )
  }
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
    const watchlistKey = KEYS.watchlist(fid)
    const watchlist = await redis.smembers(watchlistKey)

    return NextResponse.json({
      watchlist: watchlist.map(w => parseInt(String(w), 10)),
      count: watchlist.length,
    })
  } catch (error) {
    console.error('Error fetching watchlist:', error)
    return NextResponse.json(
      { error: 'Failed to fetch watchlist' },
      { status: 500 }
    )
  }
}
