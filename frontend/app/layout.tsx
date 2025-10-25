import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { ChatbotProvider } from "@/components/chatbot/chatbot-provider"
import { LoadingProvider } from "@/providers/loading-provider"
import { WalletProvider } from "@/providers/wallet-provider"
import { WalletContextProvider } from "@/context/wallet-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ChainSure - AI & Blockchain Insurance Claims",
  description: "Revolutionizing insurance claims with AI & blockchain: faster, smarter, fraud-proof",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <WalletProvider>
            <WalletContextProvider>
              <LoadingProvider>
                <ChatbotProvider>
                  {children}
                  <Toaster />
                </ChatbotProvider>
              </LoadingProvider>
            </WalletContextProvider>
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'