import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'WarehouseCAD - 3D Floorplan Designer',
  description: 'Professional warehouse and floorplan design tool with Three.js rendering',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full m-0 p-0 overflow-hidden`}>
        <div className="h-full w-full bg-gray-700">
          {children}
        </div>
      </body>
    </html>
  )
}
