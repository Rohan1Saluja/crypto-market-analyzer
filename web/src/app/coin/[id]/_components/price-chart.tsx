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
import { Activity } from "lucide-react";

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
    <section className="spectral-panel spectral-edge min-w-0 rounded-3xl">
      <div className="flex flex-col gap-4 border-b border-white/[0.06] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <div className="data-label">Price structure</div>
          <div className="mt-1 flex items-center gap-2">
            <h2 className="font-heading text-base font-medium tracking-[-0.025em]">
              {symbol} / USD
            </h2>
            <Activity className="size-3.5 text-[var(--spectral-glacier)]" />
          </div>
          <p className="mt-1.5 text-[10px] leading-5 text-muted-foreground">
            Hourly market history over the last seven days.
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-white/[0.07] bg-black/10 p-1 font-mono text-[9px] uppercase tracking-[0.08em]">
          {["24H", "7D", "30D"].map((range) => (
            <span
              key={range}
              className={
                range === "7D"
                  ? "rounded-lg bg-white/[0.08] px-2.5 py-1.5 text-foreground"
                  : "rounded-lg px-2.5 py-1.5 text-muted-foreground"
              }
            >
              {range}
            </span>
          ))}
        </div>
      </div>

      <div className="px-2 pb-4 pt-5 sm:px-4">
        {data.length > 0 ? (
          <div className="h-[390px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 12, right: 12, left: 2, bottom: 0 }}>
                <defs>
                  <linearGradient id="coin-price-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="2%"
                      stopColor="var(--spectral-glacier)"
                      stopOpacity={0.22}
                    />
                    <stop
                      offset="48%"
                      stopColor="var(--spectral-violet)"
                      stopOpacity={0.08}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--spectral-violet)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  stroke="oklch(0.92 0.02 292 / 6%)"
                  strokeDasharray="2 6"
                  vertical={false}
                />
                <XAxis
                  dataKey="timestamp"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 9 }}
                  minTickGap={42}
                  tickFormatter={(value) => formatAxisDate(Number(value))}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  width={74}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 9 }}
                  tickFormatter={(value) => formatPrice(Number(value))}
                  domain={["dataMin", "dataMax"]}
                />
                <Tooltip
                  formatter={(value) => [formatPrice(Number(value)), "Price"]}
                  labelFormatter={(value) => formatTooltipDate(Number(value))}
                  cursor={{ stroke: "var(--spectral-glacier)", strokeOpacity: 0.18 }}
                  contentStyle={{
                    border: "1px solid oklch(0.92 0.02 292 / 10%)",
                    borderRadius: "12px",
                    background: "oklch(0.13 0.02 296 / 94%)",
                    color: "var(--foreground)",
                    boxShadow: "0 18px 60px rgba(0, 0, 0, 0.28)",
                    fontSize: "11px",
                    backdropFilter: "blur(18px)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="var(--spectral-glacier)"
                  strokeWidth={2}
                  fill="url(#coin-price-fill)"
                  activeDot={{
                    r: 4,
                    fill: "var(--spectral-glacier)",
                    stroke: "var(--background)",
                    strokeWidth: 2,
                  }}
                  animationDuration={650}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-[390px] items-center justify-center text-xs text-muted-foreground">
            Price history is currently unavailable for this asset.
          </div>
        )}
      </div>
    </section>
  );
}
