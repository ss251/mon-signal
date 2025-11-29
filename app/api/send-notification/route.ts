import { NextRequest } from "next/server";
import { z } from "zod";
import { sendFrameNotification } from "@/lib/notifs";

const requestSchema = z.object({
  fid: z.number(),
  title: z.string().optional(),
  body: z.string().optional(),
});

/**
 * API route to send a test notification to a user.
 * With Neynar managed notifications, we don't need notification tokens.
 */
export async function POST(request: NextRequest) {
  const requestJson = await request.json();
  const requestBody = requestSchema.safeParse(requestJson);

  if (requestBody.success === false) {
    return Response.json(
      { success: false, errors: requestBody.error.errors },
      { status: 400 }
    );
  }

  const sendResult = await sendFrameNotification({
    fid: requestBody.data.fid,
    title: requestBody.data.title || "Test notification",
    body: requestBody.data.body || "Sent at " + new Date().toISOString(),
  });

  if (sendResult.state === "error") {
    return Response.json(
      { success: false, error: sendResult.error },
      { status: 500 }
    );
  }

  return Response.json({ success: true });
}
