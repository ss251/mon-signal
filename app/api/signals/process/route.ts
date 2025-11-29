import { NextResponse } from 'next/server'
import { fetchRecentTrades } from '@/lib/envio'
import { processTradesBatch } from '@/lib/signal-matcher'
import { redis, KEYS } from '@/lib/redis'

// Secret for authenticating cron/webhook calls
const CRON_SECRET = process.env.CRON_SECRET

/**
 * POST /api/signals/process
 *
 * Fetches recent trades from Envio and processes them for notifications.
 * Can be called by:
 * 1. Vercel Cron (with CRON_SECRET header)
 * 2. External webhook from Envio
 * 3. Manual trigger for testing
 */
export async function POST(request: Request) {
  // Verify cron secret if configured
  if (CRON_SECRET) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    // Get last processed block to only fetch new trades
    const lastBlock = await redis.get<number>(KEYS.lastBlock) || 0

    // Fetch recent trades from Envio
    const trades = await fetchRecentTrades(100)

    if (trades.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No new trades to process',
        processed: 0,
        notificationsSent: 0,
      })
    }

    // Filter to only trades newer than last processed
    const newTrades = lastBlock > 0
      ? trades.filter(t => t.blockNumber > lastBlock)
      : trades

    if (newTrades.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No new trades since last check',
        processed: 0,
        notificationsSent: 0,
      })
    }

    // Process the trades
    const result = await processTradesBatch(newTrades)

    // Update last processed block
    const maxBlock = Math.max(...newTrades.map(t => t.blockNumber))
    await redis.set(KEYS.lastBlock, maxBlock)

    return NextResponse.json({
      success: true,
      ...result,
      lastBlock: maxBlock,
    })
  } catch (error) {
    console.error('Signal processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process signals' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/signals/process
 * Health check and status endpoint.
 */
export async function GET() {
  try {
    const lastBlock = await redis.get<number>(KEYS.lastBlock) || 0

    return NextResponse.json({
      status: 'ok',
      lastProcessedBlock: lastBlock,
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: 'Failed to get status',
    })
  }
}
