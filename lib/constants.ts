export const MESSAGE_EXPIRATION_TIME = 1000 * 60 * 60 * 24 * 30; // 30 days

const appUrl = process.env.NEXT_PUBLIC_URL;

if (!appUrl) {
  throw new Error('NEXT_PUBLIC_URL is not set');
}

export const APP_URL: string = appUrl;
