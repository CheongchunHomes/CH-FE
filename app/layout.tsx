import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { AuthProvider } from '@/lib/auth-context'
import { ApiFeedbackModal } from '@/components/api-feedback-modal'
import ChatBotWrapper from "@/components/chat/ChatBotWrapper";
import './globals.css'

export const metadata: Metadata = {
  title: "청춘홈즈",
  description: "",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>
        <AuthProvider>
          <ApiFeedbackModal />
          {children}
          <ChatBotWrapper />
        </AuthProvider>
      </body>
    </html>
  )
}
