import App from '@/components/pages/app'
import { APP_URL } from '@/lib/constants'
import type { Metadata } from 'next'

const frame = {
  version: 'next',
  imageUrl: `${APP_URL}/images/feed.png`,
  button: {
    title: 'Launch App',
    action: {
      type: 'launch_frame',
      name: 'Mon Signal',
      url: APP_URL,
      splashImageUrl: `${APP_URL}/images/splash.png`,
      splashBackgroundColor: '#f7f7f7',
    },
  },
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Mon Signal',
    openGraph: {
      title: 'Mon Signal',
      description: 'Farcaster trading signals on Monad',
    },
    other: {
      'fc:frame': JSON.stringify(frame),
    },
  }
}

export default function Home() {
  return <App />
}
