"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Add a class to the body when the theme changes to enable transitions
  React.useEffect(() => {
    document.body.classList.add("theme-transition")

    // Clean up function
    return () => {
      document.body.classList.remove("theme-transition")
    }
  }, [])

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

