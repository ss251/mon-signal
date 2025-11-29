import {
  ParseWebhookEvent,
  parseWebhookEvent,
  verifyAppKeyWithNeynar,
} from "@farcaster/miniapp-node";
import { NextRequest } from "next/server";
import { sendFrameNotification } from "@/lib/notifs";
import { subscribeUser, unsubscribeUser } from "@/lib/social-graph";

/**
 * Webhook handler for Farcaster Mini App events.
 *
 * With Neynar managed notifications, we don't need to store notification tokens.
 * Neynar handles all token management automatically via the webhookUrl in farcaster.json.
 *
 * This webhook still receives events so we can:
 * 1. Send welcome notifications when users add the app
 * 2. Track user engagement events
 * 3. Clean up any app-specific data when users remove the app
 */
export async function POST(request: NextRequest) {
  const requestJson = await request.json();

  let data;
  try {
    data = await parseWebhookEvent(requestJson, verifyAppKeyWithNeynar);
  } catch (e: unknown) {
    const error = e as ParseWebhookEvent.ErrorType;

    switch (error.name) {
      case "VerifyJsonFarcasterSignature.InvalidDataError":
      case "VerifyJsonFarcasterSignature.InvalidEventDataError":
        return Response.json(
          { success: false, error: error.message },
          { status: 400 }
        );
      case "VerifyJsonFarcasterSignature.InvalidAppKeyError":
        return Response.json(
          { success: false, error: error.message },
          { status: 401 }
        );
      case "VerifyJsonFarcasterSignature.VerifyAppKeyError":
        return Response.json(
          { success: false, error: error.message },
          { status: 500 }
        );
    }
  }

  const fid = data.fid;
  const event = data.event;

  switch (event.event) {
    case "frame_added":
      // User added the mini app - subscribe them and send welcome notification
      await subscribeUser(fid);
      if (event.notificationDetails) {
        await sendFrameNotification({
          fid,
          title: "Welcome to Mon Signal",
          body: "You'll now receive trading signals from your network",
        });
      }
      break;

    case "frame_removed":
      // User removed the mini app - unsubscribe them
      await unsubscribeUser(fid);
      break;

    case "notifications_enabled":
      // Subscribe and build social graph
      await subscribeUser(fid);
      await sendFrameNotification({
        fid,
        title: "Notifications enabled",
        body: "You'll receive trading signals from people you follow",
      });
      break;

    case "notifications_disabled":
      // Unsubscribe - no more notifications
      await unsubscribeUser(fid);
      break;
  }

  return Response.json({ success: true });
}
