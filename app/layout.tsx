import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ProFeatureGate } from "@/components/pro-feature-gate";
import { ThemeProvider } from "@/components/theme-provider";

import type { Metadata, Viewport } from "next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://marlinnotes.com"),
  title: "Marlin - GitHub Native Notes",
  description: "Local-first note-taking app powered by GitHub",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Marlin",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5, // Allow zoom for iOS accessibility and input focus
  userScalable: true,
  interactiveWidget: "resizes-content",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="icon"
          href="/logo-light.svg"
          type="image/svg+xml"
          media="(prefers-color-scheme: dark)"
        />
        <link
          rel="icon"
          href="/logo-dark.svg"
          type="image/svg+xml"
          media="(prefers-color-scheme: light)"
        />
        <link rel="apple-touch-icon" href="/logo-light.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#30CF79" />
        {/* 
          Blocking script to prevent theme flash (FOUC) 
          Required for Next.js App Router since next-themes' built-in script injection 
          relies on next/head which is deprecated in App Router.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `!function(){try{var d=document.documentElement,t=localStorage.getItem('theme');d.classList.toggle('dark',t==='dark'||(!t||t==='system')&&matchMedia('(prefers-color-scheme:dark)').matches)}catch(e){}}()`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <ConfirmDialog />
          <ProFeatureGate />
        </ThemeProvider>
      </body>
    </html>
  );
}
