"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { FileDown, FileText, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/contexts/language-context"
import type { Transaction } from "@/types/transaction"

interface ExportDataProps {
  transactions: Transaction[]
}

export default function ExportData({ transactions }: ExportDataProps) {
  const { language, translations } = useLanguage()
  const t = translations[language].export
  const { toast } = useToast()

  const [dateRange, setDateRange] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (format: "csv" | "pdf") => {
    setIsExporting(true)

    try {
      // Filter transactions by date range if needed
      let filteredTransactions = transactions

      if (dateRange === "custom") {
        filteredTransactions = transactions.filter((transaction) => {
          const transactionDate = new Date(transaction.date)
          const start = startDate ? new Date(startDate) : new Date(0)
          const end = endDate ? new Date(endDate) : new Date()

          return transactionDate >= start && transactionDate <= end
        })
      }

      // In a real app, you would generate and download the file here
      // For this demo, we'll just simulate a delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      toast({
        title: t.exportSuccess,
        variant: "default",
      })
    } catch (error) {
      toast({
        title: t.exportError,
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label>{t.dateRangeLabel}</Label>
          <RadioGroup
            defaultValue="all"
            value={dateRange}
            onValueChange={setDateRange}
            className="flex flex-col space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="all" />
              <Label htmlFor="all" className="cursor-pointer">
                {t.allDataLabel}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="custom" id="custom" />
              <Label htmlFor="custom" className="cursor-pointer">
                {t.dateRangeLabel}
              </Label>
            </div>
          </RadioGroup>
        </div>

        {dateRange === "custom" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-2 gap-4"
          >
            <div className="space-y-2">
              <Label htmlFor="startDate">{t.startDateLabel}</Label>
              <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">{t.endDateLabel}</Label>
              <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </motion.div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => handleExport("csv")}
          disabled={isExporting || (dateRange === "custom" && (!startDate || !endDate))}
          className="w-full mr-2"
        >
          {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
          {t.csvButton}
        </Button>
        <Button
          onClick={() => handleExport("pdf")}
          disabled={isExporting || (dateRange === "custom" && (!startDate || !endDate))}
          className="w-full ml-2"
        >
          {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
          {t.pdfButton}
        </Button>
      </CardFooter>
    </Card>
  )
}

