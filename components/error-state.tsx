"use client"

import { AlertTriangle, RefreshCw } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"

interface ErrorStateProps {
  onRetry: () => void
}

export default function ErrorState({ onRetry }: ErrorStateProps) {
  const { language, translations } = useLanguage()
  const t = translations[language].errorState

  return (
    <motion.div
      className="flex flex-col items-center justify-center py-12 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-6 rounded-full bg-destructive/10 p-6">
        <AlertTriangle className="h-12 w-12 text-destructive" />
      </div>
      <h2 className="text-2xl font-bold mb-2">{t.title}</h2>
      <p className="text-muted-foreground max-w-md mb-6">{t.description}</p>
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button onClick={onRetry} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          {t.retryButton}
        </Button>
      </motion.div>
    </motion.div>
  )
}

