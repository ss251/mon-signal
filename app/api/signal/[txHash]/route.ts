import { NextResponse } from 'next/server'
import { getUsersByWalletAddress } from '@/lib/neynar'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const ENVIO_GRAPHQL_URL = process.env.ENVIO_GRAPHQL_URL || 'http://localhost:8080/v1/graphql'
const ENVIO_ADMIN_SECRET = process.env.ENVIO_ADMIN_SECRET || 'testing'

type TradeResponse = {
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

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export async function GET(
  request: Request,
  { params }: { params: { txHash: string } }
) {
  try {
    const txHash = params.txHash.toLowerCase()

    // Query Envio for the trade by txHash
    const query = `
      query TradeByTxHash($txHash: String!) {
        Trade(where: {txHash: {_eq: $txHash}}, limit: 1) {
          id
          txHash
          logIndex
          blockNumber
          blockTimestamp
          tokenAddress
          fromAddress
          toAddress
          amount
        }
      }
    `

    const response = await fetch(ENVIO_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': ENVIO_ADMIN_SECRET,
      },
      body: JSON.stringify({ query, variables: { txHash } }),
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`Envio API error: ${response.status}`)
    }

    const result = await response.json()
    const trade = result.data?.Trade?.[0]

    if (!trade) {
      return NextResponse.json(
        { error: 'Signal not found' },
        { status: 404 }
      )
    }

    // Look up Farcaster user for the trader
    const addresses = [trade.fromAddress, trade.toAddress].filter(
      (addr: string) => addr !== ZERO_ADDRESS
    )

    let trader = null
    if (addresses.length > 0) {
      try {
        const users = await getUsersByWalletAddress(addresses)
        for (const [, userList] of Object.entries(users)) {
          if (userList && Array.isArray(userList) && userList.length > 0) {
            const user = userList[0]
            trader = {
              fid: user.fid,
              username: user.username,
              displayName: user.display_name || user.username,
              pfpUrl: user.pfp_url,
            }
            break
          }
        }
      } catch (err) {
        console.error('Failed to fetch Farcaster user:', err)
      }
    }

    // Determine trade type
    const isMint = trade.fromAddress === ZERO_ADDRESS
    const type = isMint ? 'buy' : 'sell'
    const traderAddress = isMint ? trade.toAddress : trade.fromAddress

    const signal: TradeResponse = {
      id: trade.id,
      type,
      trader,
      token: {
        symbol: `${trade.tokenAddress.slice(0, 6)}...`,
        name: 'Unknown Token',
        address: trade.tokenAddress,
      },
      amount: formatAmount(trade.amount),
      timestamp: new Date(trade.blockTimestamp * 1000).toISOString(),
      txHash: trade.txHash,
      fromAddress: trade.fromAddress,
      toAddress: trade.toAddress,
    }

    return NextResponse.json({ signal })
  } catch (error) {
    console.error('Error fetching signal:', error)
    return NextResponse.json(
      { error: 'Failed to fetch signal' },
      { status: 500 }
    )
  }
}

function formatAmount(amount: string, decimals = 18): string {
  const value = BigInt(amount)
  const divisor = BigInt(10 ** decimals)
  const whole = value / divisor
  const fraction = value % divisor

  if (whole > BigInt(0)) {
    return whole.toString()
  }

  const fractionStr = fraction.toString().padStart(decimals, '0')
  return `0.${fractionStr.slice(0, 4)}`
}
