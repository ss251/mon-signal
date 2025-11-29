import { redis, KEYS, TTL } from './redis'
import { getSubscribersFollowingWallet } from './social-graph'
import { getUsersByWalletAddress } from './neynar'
import { sendBulkFrameNotification } from './notifs'
import { APP_URL } from './constants'
import type { IndexedTrade } from './envio'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

/**
 * Process a trade and send notifications to relevant subscribers.
 * This is the core signal matching logic.
 */
export async function processTradeSignal(trade: IndexedTrade): Promise<{
  processed: boolean
  notificationsSent: number
  reason?: string
}> {
  // Check if we've already processed this transaction
  const processedKey = KEYS.processedTx(trade.txHash)
  const alreadyProcessed = await redis.get(processedKey)
  if (alreadyProcessed) {
    return { processed: false, notificationsSent: 0, reason: 'already_processed' }
  }

  // Determine trade type and trader address
  const isMint = trade.fromAddress === ZERO_ADDRESS
  const isBurn = trade.toAddress === ZERO_ADDRESS

  let type: 'buy' | 'sell'
  let traderAddress: string

  if (isMint) {
    type = 'buy'
    traderAddress = trade.toAddress
  } else if (isBurn) {
    type = 'sell'
    traderAddress = trade.fromAddress
  } else {
    // Regular transfer - treat as sell from sender's perspective
    type = 'sell'
    traderAddress = trade.fromAddress
  }

  // Skip zero address
  if (traderAddress === ZERO_ADDRESS) {
    return { processed: false, notificationsSent: 0, reason: 'zero_address' }
  }

  // Get trader's Farcaster identity
  let traderFid: number | undefined
  let traderUsername: string | undefined

  try {
    const users = await getUsersByWalletAddress([traderAddress])
    const userArray = users[traderAddress.toLowerCase()]
    if (userArray && userArray.length > 0) {
      traderFid = userArray[0].fid
      traderUsername = userArray[0].username
    }
  } catch (error) {
    console.error('Failed to fetch trader identity:', error)
  }

  // If trader has no Farcaster identity, skip notifications
  // (but still mark as processed to avoid re-checking)
  if (!traderFid) {
    await redis.set(processedKey, '1', { ex: TTL.processedTx })
    return { processed: true, notificationsSent: 0, reason: 'no_farcaster_identity' }
  }

  // Find all subscribers who follow this trader
  const subscribers = await getSubscribersFollowingWallet(traderAddress)

  if (subscribers.length === 0) {
    await redis.set(processedKey, '1', { ex: TTL.processedTx })
    return { processed: true, notificationsSent: 0, reason: 'no_subscribers' }
  }

  // Build notification content
  const action = type === 'buy' ? 'bought' : 'sold'
  const tokenSymbol = trade.tokenAddress.slice(0, 8) // TODO: Get proper token symbol
  const title = `@${traderUsername} ${action} tokens`
  const body = `${traderUsername} just ${action} ${tokenSymbol}... on Monad`
  const targetUrl = `${APP_URL}?tx=${trade.txHash}`

  // Send notifications
  let notificationsSent = 0
  try {
    const result = await sendBulkFrameNotification({
      fids: subscribers,
      title,
      body,
      targetUrl,
    })

    if (result.state === 'success') {
      notificationsSent = subscribers.length
    }
  } catch (error) {
    console.error('Failed to send notifications:', error)
  }

  // Mark as processed
  await redis.set(processedKey, '1', { ex: TTL.processedTx })

  return { processed: true, notificationsSent }
}

/**
 * Process multiple trades in batch.
 * Used for webhook handling.
 */
export async function processTradesBatch(trades: IndexedTrade[]): Promise<{
  processed: number
  notificationsSent: number
}> {
  let processed = 0
  let notificationsSent = 0

  for (const trade of trades) {
    const result = await processTradeSignal(trade)
    if (result.processed) {
      processed++
      notificationsSent += result.notificationsSent
    }
  }

  return { processed, notificationsSent }
}
