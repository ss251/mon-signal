import { NextResponse } from 'next/server'
import { redis, KEYS, TTL } from '@/lib/redis'
import { sendNotification, getUsersByWalletAddress } from '@/lib/neynar'

// Disable caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Rate limit: 1 notification per 30 seconds per user
const NOTIFICATION_COOLDOWN_SECONDS = 30

type TradeWebhookPayload = {
  txHash: string
  fromAddress: string
  toAddress: string
  tokenAddress: string
  amount: string
  blockNumber: number
  blockTimestamp: number
}

/**
 * Webhook endpoint to receive trade events from the indexer
 * and send push notifications to watchers.
 *
 * Flow:
 * 1. Receive trade event from indexer
 * 2. Check if already processed (dedup)
 * 3. Look up who is watching the trader's wallet
 * 4. Check rate limits per user
 * 5. Send notifications with deep link to signal
 */
export async function POST(request: Request) {
  try {
    // Verify webhook secret if configured
    const webhookSecret = process.env.WEBHOOK_SECRET
    if (webhookSecret) {
      const authHeader = request.headers.get('authorization')
      if (authHeader !== `Bearer ${webhookSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const payload: TradeWebhookPayload = await request.json()
    const { txHash, fromAddress, toAddress, tokenAddress, amount, blockTimestamp } = payload

    // Check if already processed
    const processedKey = KEYS.processedTx(txHash)
    const alreadyProcessed = await redis.get(processedKey)
    if (alreadyProcessed) {
      return NextResponse.json({ success: true, message: 'Already processed' })
    }

    // Mark as processed with TTL
    await redis.set(processedKey, '1', { ex: TTL.processedTx })

    // Determine trader address (from or to, depending on trade direction)
    // For now, we notify about both sender and receiver activity
    const addresses = [fromAddress.toLowerCase(), toAddress.toLowerCase()]
      .filter(addr => addr !== '0x0000000000000000000000000000000000000000')

    // Collect all watchers across both addresses
    const watcherFids = new Set<number>()
    for (const address of addresses) {
      const watchingKey = KEYS.watching(address)
      const watchers = await redis.smembers(watchingKey)
      for (const watcher of watchers) {
        watcherFids.add(typeof watcher === 'string' ? parseInt(watcher, 10) : watcher as number)
      }
    }

    if (watcherFids.size === 0) {
      return NextResponse.json({ success: true, message: 'No watchers' })
    }

    // Look up Farcaster user info for the trader
    const traderInfo = await getUsersByWalletAddress(addresses)
    let traderUsername = 'Someone'
    let traderFid: number | null = null

    for (const [addr, users] of Object.entries(traderInfo)) {
      if (users && Array.isArray(users) && users.length > 0) {
        traderUsername = users[0].username
        traderFid = users[0].fid
        break
      }
    }

    // Filter watchers by rate limit
    const eligibleFids: number[] = []
    const now = Math.floor(Date.now() / 1000)
    const watcherFidsArray = Array.from(watcherFids)

    for (const fid of watcherFidsArray) {
      const cooldownKey = `notif_cooldown:${fid}`
      const lastNotified = await redis.get(cooldownKey)

      if (!lastNotified || (now - parseInt(String(lastNotified), 10)) >= NOTIFICATION_COOLDOWN_SECONDS) {
        eligibleFids.push(fid)
        // Set cooldown
        await redis.set(cooldownKey, String(now), { ex: NOTIFICATION_COOLDOWN_SECONDS })
      }
    }

    if (eligibleFids.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All watchers rate limited',
        watcherCount: watcherFids.size
      })
    }

    // Determine trade type for notification
    const isMint = fromAddress.toLowerCase() === '0x0000000000000000000000000000000000000000'
    const isBurn = toAddress.toLowerCase() === '0x0000000000000000000000000000000000000000'
    const tradeType = isMint ? 'bought' : isBurn ? 'sold' : 'traded'

    // Format token symbol (shortened address if unknown)
    const tokenSymbol = tokenAddress.slice(0, 6) + '...'

    // Create notification
    const appUrl = process.env.NEXT_PUBLIC_URL || 'https://monsignal.xyz'
    const signalId = txHash // Use txHash as signal ID
    const targetUrl = `${appUrl}?signal=${signalId}`

    const notification = {
      targetFids: eligibleFids,
      title: `${traderUsername} ${tradeType}`,
      body: `Just ${tradeType} ${tokenSymbol} on Monad. Tap to copy trade.`,
      targetUrl,
    }

    console.log(`[Notification] Sending to ${eligibleFids.length} users:`, notification)

    const result = await sendNotification(notification)

    if (!result.success) {
      console.error('[Notification] Failed:', result.error)
    }

    return NextResponse.json({
      success: true,
      notificationsSent: result.success ? eligibleFids.length : 0,
      totalWatchers: watcherFids.size,
      signalId,
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to check webhook health
 */
export async function GET() {
  return NextResponse.json({ status: 'ok', endpoint: 'trade-webhook' })
}
