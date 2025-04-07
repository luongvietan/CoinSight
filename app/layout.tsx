"use client";

import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/contexts/language-context";
import { AuthProvider } from "@/contexts/auth-context";
import { CustomToaster } from "@/components/ui/custom-toast";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

// Metadata không thể được sử dụng trong Client Component
// export const metadata: Metadata = {
//   title: "CoinSight - AI-Powered Finance Management",
//   description: "Manage your personal finances with AI insights",
//   generator: "v0.dev",
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>CoinSight - AI-Powered Finance Management</title>
        <meta
          name="description"
          content="Manage your personal finances with AI insights"
        />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.className
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            <AuthProvider>
              <CustomToaster />
              {children}
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
