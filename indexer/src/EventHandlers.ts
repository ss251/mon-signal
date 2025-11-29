import { ERC20, Trade, Account } from "generated";

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
  },
  { wildcard: true } // Enable wildcard mode to index ALL ERC20 transfers
);
