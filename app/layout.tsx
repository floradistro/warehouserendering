import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'WarehouseCAD - 3D Floorplan Designer',
  description: 'Professional warehouse and floorplan design tool with Three.js rendering',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'WarehouseCAD',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`${inter.className} h-full m-0 p-0 overflow-hidden touch-none`}>
        <div className="h-full w-full bg-gray-700">
          {children}
        </div>
      </body>
    </html>
  )
}
