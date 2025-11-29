import assert from "assert";
import { TestHelpers, Account } from "generated";
const { MockDb, ERC20, Addresses } = TestHelpers;

describe("Transfers", () => {
  it("Transfer creates trade and updates account trade counts", async () => {
    // Instantiate a mock DB
    const mockDbEmpty = MockDb.createMockDb();

    // Get mock addresses from helpers
    const userAddress1 = Addresses.mockAddresses[0];
    const userAddress2 = Addresses.mockAddresses[1];

    // Create a mock Transfer event from userAddress1 to userAddress2
    const mockTransfer = ERC20.Transfer.createMockEvent({
      from: userAddress1,
      to: userAddress2,
      value: 1000000000000000000n, // 1 token
    });

    // Process the mockEvent
    const mockDbAfterTransfer = await ERC20.Transfer.processEvent({
      event: mockTransfer,
      mockDb: mockDbEmpty,
    });

    // Get the trade count of userAddress1 after the transfer
    const account1TradeCount =
      mockDbAfterTransfer.entities.Account.get(userAddress1)?.tradeCount;

    // Assert the expected trade count
    assert.equal(
      1,
      account1TradeCount,
      "Should have incremented userAddress1 trade count to 1",
    );

    // Get the trade count of userAddress2 after the transfer
    const account2TradeCount =
      mockDbAfterTransfer.entities.Account.get(userAddress2)?.tradeCount;

    // Assert the expected trade count
    assert.equal(
      1,
      account2TradeCount,
      "Should have incremented userAddress2 trade count to 1",
    );
  });
});
