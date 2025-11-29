import { NextResponse } from "next/server";
import { APP_URL } from "../../../lib/constants";

export async function GET() {
  const farcasterConfig = {
    accountAssociation: {
      header:
        "eyJmaWQiOjY1NzM3MCwidHlwZSI6ImF1dGgiLCJrZXkiOiIweGE4YkVhNUJCZjVGRUZkNGJmNDU1NDA1YmU0YkI0NmVGMjVmMzM0NjcifQ",
      payload: "eyJkb21haW4iOiJtb25zaWduYWwubmdyb2suYXBwIn0",
      signature:
        "kisJpJyyohVPtcHNLPlbRtnduefpEpsMRGnDWA7QgWoaF5s/+qaHNuDuJOudsKidT7kyI7AHVa7oFbXImro08xw=",
    },
    frame: {
      version: "1",
      name: "Mon Signal",
      iconUrl: `${APP_URL}/images/icon.png`,
      homeUrl: `${APP_URL}`,
      imageUrl: `${APP_URL}/images/feed.png`,
      screenshotUrls: [],
      tags: ["monad", "farcaster", "miniapp", "template"],
      primaryCategory: "developer-tools",
      buttonTitle: "Launch App",
      splashImageUrl: `${APP_URL}/images/splash.png`,
      splashBackgroundColor: "#ffffff",
      webhookUrl: `https://api.neynar.com/f/app/f19e3bdc-d4af-40b3-944c-094e09c22e89/event`,
    },
  };

  return NextResponse.json(farcasterConfig);
}
