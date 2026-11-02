import type { MetadataRoute } from 'next'

// Tells phones how to install the app: name, icons, and full screen display.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Griot',
    short_name: 'Griot',
    description: 'Know what threatens your money before it hits.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#0f1430',
    theme_color: '#0f1430',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
