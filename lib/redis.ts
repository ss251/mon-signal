import { Redis } from '@upstash/redis'

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  console.warn('Redis credentials not configured - using mock storage')
}

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
})

// Key patterns for organized data storage
export const KEYS = {
  // Social graph: stores wallet addresses of users someone follows
  // Format: "following:{fid}" -> Set of wallet addresses
  following: (fid: number) => `following:${fid}`,

  // Reverse lookup: which FIDs are following a wallet
  // Format: "followers:{wallet}" -> Set of FIDs
  followers: (wallet: string) => `followers:${wallet.toLowerCase()}`,

  // Subscription status: is a user subscribed to notifications
  // Format: "subscribed:{fid}" -> "1" if subscribed
  subscribed: (fid: number) => `subscribed:${fid}`,

  // Last processed block for webhook deduplication
  lastBlock: 'last_processed_block',

  // Processed transaction hashes to avoid duplicate notifications
  processedTx: (txHash: string) => `processed:${txHash.toLowerCase()}`,
}

// TTL values
export const TTL = {
  socialGraph: 60 * 60, // 1 hour - social graph cache
  processedTx: 60 * 60 * 24, // 24 hours - dedup window for transactions
}
