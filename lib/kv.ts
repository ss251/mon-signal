import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export { redis };

/**
 * Redis is now used for:
 * - Caching wallet → FID mappings for fast on-chain activity lookups
 * - Storing user subscription preferences
 * - Caching following lists to reduce Neynar API calls
 * - Trade event deduplication
 *
 * Notification token management is handled by Neynar automatically.
 */

// Wallet to FID cache (for quick lookups when processing on-chain events)
const WALLET_FID_PREFIX = "wallet:";
const WALLET_FID_TTL = 60 * 60 * 24; // 24 hours

export async function cacheWalletToFid(
  wallet: string,
  fid: number
): Promise<void> {
  await redis.set(`${WALLET_FID_PREFIX}${wallet.toLowerCase()}`, fid, {
    ex: WALLET_FID_TTL,
  });
}

export async function getCachedFidForWallet(
  wallet: string
): Promise<number | null> {
  return await redis.get<number>(`${WALLET_FID_PREFIX}${wallet.toLowerCase()}`);
}

// User following list cache
const FOLLOWING_PREFIX = "following:";
const FOLLOWING_TTL = 60 * 60; // 1 hour

export async function cacheUserFollowing(
  fid: number,
  followingFids: number[]
): Promise<void> {
  await redis.set(`${FOLLOWING_PREFIX}${fid}`, followingFids, {
    ex: FOLLOWING_TTL,
  });
}

export async function getCachedUserFollowing(
  fid: number
): Promise<number[] | null> {
  return await redis.get<number[]>(`${FOLLOWING_PREFIX}${fid}`);
}

// User subscription status
const SUBSCRIPTION_PREFIX = "subscription:";

export async function setUserSubscribed(
  fid: number,
  subscribed: boolean
): Promise<void> {
  await redis.set(`${SUBSCRIPTION_PREFIX}${fid}`, subscribed);
}

export async function isUserSubscribed(fid: number): Promise<boolean> {
  const result = await redis.get<boolean>(`${SUBSCRIPTION_PREFIX}${fid}`);
  return result ?? false;
}

// Trade event deduplication
const TRADE_EVENT_PREFIX = "trade:";
const TRADE_EVENT_TTL = 60 * 60 * 24 * 7; // 7 days

export async function hasProcessedTrade(tradeId: string): Promise<boolean> {
  const result = await redis.get(`${TRADE_EVENT_PREFIX}${tradeId}`);
  return result !== null;
}

export async function markTradeProcessed(tradeId: string): Promise<void> {
  await redis.set(`${TRADE_EVENT_PREFIX}${tradeId}`, 1, {
    ex: TRADE_EVENT_TTL,
  });
}
