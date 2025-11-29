import { NextResponse } from 'next/server'
import { fetchRecentTrades, type IndexedTrade } from '@/lib/envio'
import { getUsersByWalletAddress } from '@/lib/neynar'

export type TradeResponse = {
  id: string
  type: 'buy' | 'sell'
  trader: {
    fid: number
    username: string
    displayName: string
    pfpUrl?: string
  } | null
  token: {
    symbol: string
    name: string
    address: string
    logoUrl?: string
  }
  amount: string
  amountUsd?: string
  timestamp: string
  txHash: string
  fromAddress: string
  toAddress: string
}

// Zero address indicates minting (buy) or burning (sell)
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

// Known token metadata (can be expanded or fetched from an API)
const TOKEN_METADATA: Record<string, { symbol: string; name: string; decimals: number }> = {
  // Add known tokens here - will default to showing address if unknown
}

function formatAmount(amount: string, decimals = 18): string {
  const value = BigInt(amount)
  const divisor = BigInt(10 ** decimals)
  const whole = value / divisor
  const fraction = value % divisor

  if (whole > 0n) {
    return whole.toString()
  }

  // For small amounts, show more precision
  const fractionStr = fraction.toString().padStart(decimals, '0')
  return `0.${fractionStr.slice(0, 4)}`
}

function getTokenInfo(address: string): { symbol: string; name: string } {
  const metadata = TOKEN_METADATA[address.toLowerCase()]
  if (metadata) {
    return { symbol: metadata.symbol, name: metadata.name }
  }
  // Default: show truncated address
  return {
    symbol: `${address.slice(0, 6)}...`,
    name: 'Unknown Token',
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const fid = searchParams.get('fid') // Optional: filter by user's following

    // Fetch recent trades from Envio
    const trades = await fetchRecentTrades(limit)

    if (trades.length === 0) {
      return NextResponse.json({ trades: [] })
    }

    // Collect unique addresses to look up Farcaster users
    const uniqueAddresses = new Set<string>()
    for (const trade of trades) {
      if (trade.fromAddress !== ZERO_ADDRESS) {
        uniqueAddresses.add(trade.fromAddress)
      }
      if (trade.toAddress !== ZERO_ADDRESS) {
        uniqueAddresses.add(trade.toAddress)
      }
    }

    // Batch lookup Farcaster users by wallet address
    let farcasterUsers: Record<string, { fid: number; username: string; displayName: string; pfpUrl?: string }> = {}

    if (uniqueAddresses.size > 0) {
      try {
        const addressArray = Array.from(uniqueAddresses)
        // Neynar API has limits, batch in chunks of 350
        const chunks: string[][] = []
        for (let i = 0; i < addressArray.length; i += 350) {
          chunks.push(addressArray.slice(i, i + 350))
        }

        for (const chunk of chunks) {
          const response = await getUsersByWalletAddress(chunk)
          // Response is keyed by address
          for (const [address, users] of Object.entries(response)) {
            if (users && Array.isArray(users) && users.length > 0) {
              const user = users[0]
              farcasterUsers[address.toLowerCase()] = {
                fid: user.fid,
                username: user.username,
                displayName: user.display_name || user.username,
                pfpUrl: user.pfp_url,
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch Farcaster users:', error)
        // Continue without Farcaster data
      }
    }

    // Transform trades to response format
    const transformedTrades: TradeResponse[] = trades.map((trade) => {
      // Determine trade type:
      // - From zero address = mint/buy
      // - To zero address = burn/sell
      // - Otherwise, consider it from the "from" address perspective (they're selling)
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
        // Regular transfer: show as activity from the sender
        // Could also show both as separate entries
        type = 'sell' // From sender's perspective
        traderAddress = trade.fromAddress
      }

      const trader = farcasterUsers[traderAddress.toLowerCase()] || null
      const tokenInfo = getTokenInfo(trade.tokenAddress)
      const tokenMetadata = TOKEN_METADATA[trade.tokenAddress.toLowerCase()]

      return {
        id: trade.id,
        type,
        trader,
        token: {
          symbol: tokenInfo.symbol,
          name: tokenInfo.name,
          address: trade.tokenAddress,
        },
        amount: formatAmount(trade.amount, tokenMetadata?.decimals || 18),
        timestamp: new Date(trade.blockTimestamp * 1000).toISOString(),
        txHash: trade.txHash,
        fromAddress: trade.fromAddress,
        toAddress: trade.toAddress,
      }
    })

    // Optionally filter to only show trades from Farcaster users
    const farcasterOnlyTrades = transformedTrades.filter((t) => t.trader !== null)

    return NextResponse.json({
      trades: farcasterOnlyTrades.length > 0 ? farcasterOnlyTrades : transformedTrades,
      stats: {
        total: trades.length,
        withFarcaster: farcasterOnlyTrades.length,
      },
    })
  } catch (error) {
    console.error('Error fetching trades:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trades' },
      { status: 500 }
    )
  }
}
