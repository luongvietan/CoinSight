"use client"

import type * as React from "react"
import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line as RechartsLine,
  XAxis as RechartsXAxis,
  YAxis as RechartsYAxis,
  Tooltip as RechartsTooltip,
} from "recharts"

import { cn } from "@/lib/utils"

const ChartContainer = ({ className, children }: { className?: string; children: React.ReactNode }) => {
  return <div className={cn("w-full", className)}>{children}</div>
}

const Chart = ({ children }: { children: React.ReactNode }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      {children}
    </ResponsiveContainer>
  )
}

const LineChart = ({ data, children }: { data: any[]; children: React.ReactNode }) => {
  return <RechartsLineChart data={data}>{children}</RechartsLineChart>
}

const Line = ({
  dataKey,
  stroke,
  strokeWidth,
  activeDot,
}: { dataKey: string; stroke: string; strokeWidth: number; activeDot: any }) => {
  return (
    <RechartsLine type="monotone" dataKey={dataKey} stroke={stroke} strokeWidth={strokeWidth} activeDot={activeDot} />
  )
}

const XAxis = ({ dataKey }: { dataKey: string }) => {
  return <RechartsXAxis dataKey={dataKey} />
}

const YAxis = ({ tickFormatter }: { tickFormatter?: (value: any) => string }) => {
  return <RechartsYAxis tickFormatter={tickFormatter} />
}

interface ChartTooltipContentProps {
  children: React.ReactNode
}

const ChartTooltipContent = ({ children }: ChartTooltipContentProps) => {
  return <div className="bg-white border rounded-md shadow-md p-2">{children}</div>
}

interface ChartTooltipProps {
  children: (props: { active: boolean; payload: any; label: string }) => React.ReactNode
}

const ChartTooltip = ({ children }: ChartTooltipProps) => {
  return <RechartsTooltip content={children} />
}

export { Chart, ChartContainer, Line, LineChart, XAxis, YAxis, ChartTooltip, ChartTooltipContent }

