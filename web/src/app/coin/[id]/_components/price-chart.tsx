"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PricePoint } from "@/types/coin";

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value < 1 ? 4 : value < 100 ? 2 : 0,
  }).format(value);
}

function formatAxisDate(value: number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatTooltipDate(value: number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
  }).format(new Date(value));
}

export function PriceChart({
  symbol,
  data,
}: {
  symbol: string;
  data: PricePoint[];
}) {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>{symbol} price</CardTitle>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Real 7-day hourly price history from the market-data API
            </p>
          </div>
          <span className="rounded-md border bg-muted/40 px-2 py-1 text-[10px] font-medium">
            7D
          </span>
        </div>
      </CardHeader>

      <CardContent className="px-2 pb-3 pt-4 sm:px-4">
        {data.length > 0 ? (
          <div className="h-[340px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="coin-price-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--chart-2)"
                      stopOpacity={0.28}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--chart-2)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  stroke="var(--border)"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="timestamp"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  minTickGap={42}
                  tickFormatter={(value) => formatAxisDate(Number(value))}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  width={72}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  tickFormatter={(value) => formatPrice(Number(value))}
                  domain={["dataMin", "dataMax"]}
                />
                <Tooltip
                  formatter={(value) => [formatPrice(Number(value)), "Price"]}
                  labelFormatter={(value) => formatTooltipDate(Number(value))}
                  contentStyle={{
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    background: "var(--popover)",
                    color: "var(--popover-foreground)",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="var(--chart-2)"
                  strokeWidth={2}
                  fill="url(#coin-price-fill)"
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-[340px] items-center justify-center text-xs text-muted-foreground">
            Price history is currently unavailable for this asset.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
