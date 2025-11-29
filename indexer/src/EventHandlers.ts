import { ERC20, Trade, Account } from "generated";

// Webhook URL for trade notifications (set via environment variable)
const WEBHOOK_URL = process.env.TRADE_WEBHOOK_URL;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

/**
 * Send trade to webhook for notification processing
 * Fire-and-forget to not block indexing
 * Only sends for recent trades (within 5 minutes) to avoid flooding during backfill
 */
async function notifyWebhook(trade: {
  txHash: string;
  fromAddress: string;
  toAddress: string;
  tokenAddress: string;
  amount: string;
  blockNumber: number;
  blockTimestamp: number;
}) {
  if (!WEBHOOK_URL) return;

  // Skip webhooks for historical trades (older than 5 minutes)
  const now = Math.floor(Date.now() / 1000);
  const fiveMinutesAgo = now - 300;
  if (trade.blockTimestamp < fiveMinutesAgo) {
    return; // Skip historical trades during backfill
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (WEBHOOK_SECRET) {
      headers["Authorization"] = `Bearer ${WEBHOOK_SECRET}`;
    }

    // Fire and forget - don't await to avoid blocking indexer
    fetch(WEBHOOK_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(trade),
    }).catch((err) => {
      console.error("[Webhook] Failed to send:", err.message);
    });
  } catch (err) {
    console.error("[Webhook] Error:", err);
  }
}

/**
 * Handle ERC20 Transfer events using WILDCARD mode
 * This indexes ALL ERC20 Transfer events across ALL contracts on Monad
 * Store each transfer as a Trade entity for querying by wallet address
 */
ERC20.Transfer.handler(
  async ({ event, context }) => {
    const fromAddress = event.params.from.toLowerCase();
    const toAddress = event.params.to.toLowerCase();
    const tokenAddress = event.srcAddress.toLowerCase();
    const blockTimestamp = Number(event.block.timestamp);

    // Create unique trade ID from txHash and logIndex
    const tradeId = `${event.transaction.hash}-${event.logIndex}`;

    // Store the trade
    const trade: Trade = {
      id: tradeId,
      txHash: event.transaction.hash,
      logIndex: event.logIndex,
      blockNumber: event.block.number,
      blockTimestamp,
      tokenAddress,
      fromAddress,
      toAddress,
      amount: event.params.value,
    };

    context.Trade.set(trade);

    // Update sender account
    const senderAccount = await context.Account.get(fromAddress);
    context.Account.set({
      id: fromAddress,
      tradeCount: (senderAccount?.tradeCount ?? 0) + 1,
      lastSeen: blockTimestamp,
    });

    // Update receiver account
    const receiverAccount = await context.Account.get(toAddress);
    context.Account.set({
      id: toAddress,
      tradeCount: (receiverAccount?.tradeCount ?? 0) + 1,
      lastSeen: blockTimestamp,
    });

    // Notify webhook for push notifications (fire-and-forget)
    notifyWebhook({
      txHash: event.transaction.hash,
      fromAddress,
      toAddress,
      tokenAddress,
      amount: event.params.value.toString(),
      blockNumber: event.block.number,
      blockTimestamp,
    });
  },
  { wildcard: true } // Enable wildcard mode to index ALL ERC20 transfers
);
