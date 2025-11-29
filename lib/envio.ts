const ENVIO_GRAPHQL_URL = process.env.ENVIO_GRAPHQL_URL || 'http://localhost:8080/v1/graphql'
const ENVIO_ADMIN_SECRET = process.env.ENVIO_ADMIN_SECRET || 'testing'

export type IndexedTrade = {
  id: string
  txHash: string
  logIndex: number
  blockNumber: number
  blockTimestamp: number
  tokenAddress: string
  fromAddress: string
  toAddress: string
  amount: string
}

type TradesResponse = {
  data: {
    Trade: IndexedTrade[]
  }
}

type TradeCountResponse = {
  data: {
    Trade_aggregate: {
      aggregate: {
        count: number
      }
    }
  }
}

export async function fetchRecentTrades(limit = 50): Promise<IndexedTrade[]> {
  const query = `
    query RecentTrades($limit: Int!) {
      Trade(limit: $limit, order_by: {blockTimestamp: desc}) {
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
    body: JSON.stringify({ query, variables: { limit } }),
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Envio API error: ${response.status}`)
  }

  const result: TradesResponse = await response.json()
  return result.data.Trade
}

export async function fetchTradesByAddress(
  address: string,
  limit = 50
): Promise<IndexedTrade[]> {
  const normalizedAddress = address.toLowerCase()
  const query = `
    query TradesByAddress($address: String!, $limit: Int!) {
      Trade(
        limit: $limit,
        order_by: {blockTimestamp: desc},
        where: {
          _or: [
            {fromAddress: {_eq: $address}},
            {toAddress: {_eq: $address}}
          ]
        }
      ) {
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
    body: JSON.stringify({ query, variables: { address: normalizedAddress, limit } }),
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Envio API error: ${response.status}`)
  }

  const result: TradesResponse = await response.json()
  return result.data.Trade
}

export async function fetchTradesByAddresses(
  addresses: string[],
  limit = 50
): Promise<IndexedTrade[]> {
  if (addresses.length === 0) return []

  // Build OR conditions for from/to addresses
  const normalizedAddresses = addresses.map(a => a.toLowerCase())

  const query = `
    query TradesByAddresses($addresses: [String!]!, $limit: Int!) {
      Trade(
        limit: $limit,
        order_by: {blockTimestamp: desc},
        where: {
          _or: [
            {fromAddress: {_in: $addresses}},
            {toAddress: {_in: $addresses}}
          ]
        }
      ) {
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
    body: JSON.stringify({ query, variables: { addresses: normalizedAddresses, limit } }),
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Envio API error: ${response.status}`)
  }

  const result: TradesResponse = await response.json()
  return result.data.Trade
}

export async function getTradeCount(): Promise<number> {
  const query = `
    query TradeCount {
      Trade_aggregate {
        aggregate {
          count
        }
      }
    }
  `

  const response = await fetch(ENVIO_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': ENVIO_ADMIN_SECRET,
    },
    body: JSON.stringify({ query }),
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Envio API error: ${response.status}`)
  }

  const result: TradeCountResponse = await response.json()
  return result.data.Trade_aggregate.aggregate.count
}
