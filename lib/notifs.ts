import { APP_URL } from "@/lib/constants";
import { sendNotification } from "@/lib/neynar";

type SendFrameNotificationResult =
  | {
      state: "error";
      error: string;
    }
  | { state: "success" };

/**
 * Send a notification to a Farcaster user via Neynar's managed notifications.
 * No token management needed - Neynar handles it automatically via the webhook URL in farcaster.json.
 */
export async function sendFrameNotification({
  fid,
  title,
  body,
  targetUrl,
}: {
  fid: number;
  title: string;
  body: string;
  targetUrl?: string;
}): Promise<SendFrameNotificationResult> {
  const result = await sendNotification({
    targetFids: [fid],
    title,
    body,
    targetUrl: targetUrl || APP_URL || "",
  });

  if (result.success) {
    return { state: "success" };
  }

  return { state: "error", error: result.error || "Unknown error" };
}

/**
 * Send notifications to multiple Farcaster users at once.
 */
export async function sendBulkFrameNotification({
  fids,
  title,
  body,
  targetUrl,
}: {
  fids: number[];
  title: string;
  body: string;
  targetUrl?: string;
}): Promise<SendFrameNotificationResult> {
  const result = await sendNotification({
    targetFids: fids,
    title,
    body,
    targetUrl: targetUrl || APP_URL || "",
  });

  if (result.success) {
    return { state: "success" };
  }

  return { state: "error", error: result.error || "Unknown error" };
}
