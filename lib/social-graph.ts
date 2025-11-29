import { redis, KEYS, TTL } from './redis'
import { getUserFollowing, getUsersByWalletAddress } from './neynar'

type FollowingUser = {
  fid: number
  wallets: string[]
}

/**
 * Build and cache the social graph for a user.
 * Fetches who they follow on Farcaster and their associated wallet addresses.
 */
export async function buildSocialGraph(fid: number): Promise<FollowingUser[]> {
  const cacheKey = KEYS.following(fid)

  // Check if we have a cached version
  const cached = await redis.get<FollowingUser[]>(cacheKey)
  if (cached) {
    return cached
  }

  // Fetch the user's following list from Neynar
  const following = await getUserFollowing(fid, 100)

  // Build the social graph with wallet addresses
  const socialGraph: FollowingUser[] = []

  // Get verified addresses for each followed user
  // Note: following is an array of Follower objects, which have .user property
  for (const follower of following) {
    const user = follower.user
    const wallets: string[] = []

    // Get verified addresses from the user object
    if (user.verified_addresses?.eth_addresses) {
      wallets.push(...user.verified_addresses.eth_addresses.map((a: string) => a.toLowerCase()))
    }

    // Get custody address if available
    if (user.custody_address) {
      wallets.push(user.custody_address.toLowerCase())
    }

    if (wallets.length > 0) {
      socialGraph.push({
        fid: user.fid,
        wallets,
      })
    }
  }

  // Cache the social graph
  await redis.set(cacheKey, socialGraph, { ex: TTL.socialGraph })

  // Also build reverse index: wallet -> followers
  for (const user of socialGraph) {
    for (const wallet of user.wallets) {
      await redis.sadd(KEYS.followers(wallet), fid)
    }
  }

  return socialGraph
}

/**
 * Get all FIDs who are subscribed and following the given wallet address.
 * This is the core of the signal matching logic.
 */
export async function getSubscribersFollowingWallet(wallet: string): Promise<number[]> {
  const normalizedWallet = wallet.toLowerCase()
  const followerKey = KEYS.followers(normalizedWallet)

  // Get all FIDs that follow this wallet
  const followerFids = await redis.smembers(followerKey)

  if (!followerFids || followerFids.length === 0) {
    return []
  }

  // Filter to only subscribed users
  const subscribedFids: number[] = []
  for (const fid of followerFids) {
    const fidNum = typeof fid === 'string' ? parseInt(fid, 10) : fid
    const isSubscribed = await redis.get(KEYS.subscribed(fidNum))
    if (isSubscribed) {
      subscribedFids.push(fidNum)
    }
  }

  return subscribedFids
}

/**
 * Subscribe a user to notifications.
 * Also triggers building their social graph.
 */
export async function subscribeUser(fid: number): Promise<void> {
  // Mark as subscribed
  await redis.set(KEYS.subscribed(fid), '1')

  // Build their social graph in the background
  await buildSocialGraph(fid)
}

/**
 * Unsubscribe a user from notifications.
 */
export async function unsubscribeUser(fid: number): Promise<void> {
  await redis.del(KEYS.subscribed(fid))

  // Note: We could clean up the reverse index here,
  // but it's okay to leave stale entries - they'll just
  // be filtered out by the subscription check
}

/**
 * Check if a user is subscribed.
 */
export async function isUserSubscribed(fid: number): Promise<boolean> {
  const result = await redis.get(KEYS.subscribed(fid))
  return result === '1'
}

/**
 * Refresh a user's social graph (e.g., if they followed new people).
 */
export async function refreshSocialGraph(fid: number): Promise<void> {
  // Delete the cached version
  await redis.del(KEYS.following(fid))

  // Rebuild
  await buildSocialGraph(fid)
}
