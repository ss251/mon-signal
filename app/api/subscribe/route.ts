import { NextResponse } from 'next/server'
import { subscribeUser, unsubscribeUser, isUserSubscribed } from '@/lib/social-graph'

/**
 * GET /api/subscribe?fid=123
 * Check if a user is subscribed to notifications.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const fidStr = searchParams.get('fid')

  if (!fidStr) {
    return NextResponse.json({ error: 'fid parameter required' }, { status: 400 })
  }

  const fid = parseInt(fidStr, 10)
  if (isNaN(fid)) {
    return NextResponse.json({ error: 'Invalid fid' }, { status: 400 })
  }

  try {
    const subscribed = await isUserSubscribed(fid)
    return NextResponse.json({ subscribed })
  } catch (error) {
    console.error('Failed to check subscription:', error)
    return NextResponse.json({ error: 'Failed to check subscription' }, { status: 500 })
  }
}

/**
 * POST /api/subscribe
 * Subscribe a user to notifications.
 * Body: { fid: number }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { fid } = body

    if (!fid || typeof fid !== 'number') {
      return NextResponse.json({ error: 'fid required as number' }, { status: 400 })
    }

    await subscribeUser(fid)

    return NextResponse.json({
      success: true,
      message: 'Subscribed to notifications',
    })
  } catch (error) {
    console.error('Failed to subscribe:', error)
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
  }
}

/**
 * DELETE /api/subscribe
 * Unsubscribe a user from notifications.
 * Body: { fid: number }
 */
export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { fid } = body

    if (!fid || typeof fid !== 'number') {
      return NextResponse.json({ error: 'fid required as number' }, { status: 400 })
    }

    await unsubscribeUser(fid)

    return NextResponse.json({
      success: true,
      message: 'Unsubscribed from notifications',
    })
  } catch (error) {
    console.error('Failed to unsubscribe:', error)
    return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 })
  }
}
