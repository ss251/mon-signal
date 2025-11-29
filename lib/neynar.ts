import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";

if (!process.env.NEYNAR_API_KEY) {
  throw new Error("NEYNAR_API_KEY is required");
}

const config = new Configuration({
  apiKey: process.env.NEYNAR_API_KEY,
});

export const neynarClient = new NeynarAPIClient(config);

/**
 * Send a notification to specific Farcaster users via Neynar's managed notifications.
 * Neynar handles all token management automatically.
 */
export async function sendNotification({
  targetFids,
  title,
  body,
  targetUrl,
}: {
  targetFids: number[];
  title: string;
  body: string;
  targetUrl: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await neynarClient.publishFrameNotifications({
      targetFids,
      notification: {
        title,
        body,
        target_url: targetUrl,
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get Farcaster user(s) by wallet address.
 * Used to map on-chain activity to Farcaster identities.
 */
export async function getUsersByWalletAddress(addresses: string[]) {
  const response = await neynarClient.fetchBulkUsersByEthOrSolAddress({
    addresses,
  });
  return response;
}

/**
 * Get the list of users that a given FID is following.
 * Fetches all pages if maxResults is not specified or > 100.
 */
export async function getUserFollowing(fid: number, maxResults?: number) {
  const allUsers: Awaited<ReturnType<typeof neynarClient.fetchUserFollowing>>['users'] = [];
  let cursor: string | undefined;
  const limit = 100; // Max per request

  do {
    const response = await neynarClient.fetchUserFollowing({
      fid,
      limit,
      cursor,
    });

    allUsers.push(...response.users);
    cursor = response.next?.cursor ?? undefined;

    // Stop if we've reached the max results
    if (maxResults && allUsers.length >= maxResults) {
      return allUsers.slice(0, maxResults);
    }
  } while (cursor);

  return allUsers;
}

/**
 * Get user details by FID.
 */
export async function getUserByFid(fid: number) {
  const response = await neynarClient.fetchBulkUsers({
    fids: [fid],
  });
  return response.users[0] ?? null;
}
