"use client";

import { Activity, ChartCandlestickIcon, ChartLine } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

import type { OhlcPoint, PriceHistoryRange, PricePoint } from "@/types/coin";

type ChartMode = "line" | "candles";

const ranges: { label: string; value: PriceHistoryRange }[] = [
  { label: "24H", value: "24h" },
  { label: "7D", value: "7d" },
  { label: "30D", value: "30d" },
];

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value < 1 ? 4 : value < 100 ? 2 : 0,
  }).format(value);
}

function formatAxisDate(value: number, range: PriceHistoryRange) {
  return new Intl.DateTimeFormat(
    "en-US",
    range === "24h" ? { hour: "numeric" } : { month: "short", day: "numeric" },
  ).format(new Date(value));
}

function formatTooltipDate(value: number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function chartDescription(mode: ChartMode, range: PriceHistoryRange) {
  if (mode === "line") {
    return `Hourly market history over the last ${range === "24h" ? "24 hours" : range === "7d" ? "7 days" : "30 days"}.`;
  }

  return range === "24h"
    ? "30-minute OHLC candles over the last 24 hours."
    : `4-hour OHLC candles over the last ${range === "7d" ? "7 days" : "30 days"}.`;
}

function CandlestickChart({
  data,
  range,
}: {
  data: OhlcPoint[];
  range: PriceHistoryRange;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const height = 390;
  const left = 12;
  const right = 78;
  const top = 18;
  const bottom = 30;

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
    });

    observer.observe(element);
    setWidth(element.getBoundingClientRect().width);

    return () => observer.disconnect();
  }, []);

  const geometry = useMemo(() => {
    if (width <= 0 || data.length === 0) {
      return null;
    }

    const lows = data.map((point) => point.low);
    const highs = data.map((point) => point.high);
    const rawMin = Math.min(...lows);
    const rawMax = Math.max(...highs);
    const span = rawMax - rawMin || Math.max(Math.abs(rawMax) * 0.01, 1);
    const min = rawMin - span * 0.04;
    const max = rawMax + span * 0.04;
    const plotWidth = Math.max(width - left - right, 1);
    const plotHeight = height - top - bottom;
    const step = plotWidth / data.length;
    const candleWidth = Math.max(1, Math.min(9, step * 0.62));
    const y = (value: number) =>
      top + ((max - value) / (max - min)) * plotHeight;

    return {
      min,
      max,
      plotWidth,
      plotHeight,
      step,
      candleWidth,
      y,
    };
  }, [data, width]);

  function handlePointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    if (!geometry) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - bounds.left;

    if (x < left || x > left + geometry.plotWidth) {
      setHoveredIndex(null);
      return;
    }

    const index = Math.min(
      data.length - 1,
      Math.max(0, Math.floor((x - left) / geometry.step)),
    );
    setHoveredIndex(index);
  }

  const hovered =
    hoveredIndex === null
      ? (data.at(-1) ?? null)
      : (data[hoveredIndex] ?? null);

  if (data.length === 0) {
    return null;
  }

  return (
    <div ref={containerRef} className="relative h-[390px] w-full">
      {hovered ? (
        <div className="pointer-events-none absolute left-3 top-2 z-10 rounded-xl border border-white/[0.08] bg-background/80 px-3 py-2 font-mono text-[8px] uppercase tracking-[0.06em] text-muted-foreground backdrop-blur-md">
          <div>{formatTooltipDate(hovered.timestamp)}</div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
            <span>
              O{" "}
              <strong className="text-foreground">
                {formatPrice(hovered.open)}
              </strong>
            </span>
            <span>
              H{" "}
              <strong className="signal-positive">
                {formatPrice(hovered.high)}
              </strong>
            </span>
            <span>
              L{" "}
              <strong className="signal-negative">
                {formatPrice(hovered.low)}
              </strong>
            </span>
            <span>
              C{" "}
              <strong className="text-foreground">
                {formatPrice(hovered.close)}
              </strong>
            </span>
          </div>
        </div>
      ) : null}

      {width > 0 && geometry ? (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="size-full"
          role="img"
          aria-label={`OHLC candlestick chart for the last ${range}`}
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setHoveredIndex(null)}
        >
          {[0, 1, 2, 3, 4].map((index) => {
            const ratio = index / 4;
            const value = geometry.max - (geometry.max - geometry.min) * ratio;
            const y = top + geometry.plotHeight * ratio;

            return (
              <g key={index}>
                <line
                  x1={left}
                  x2={left + geometry.plotWidth}
                  y1={y}
                  y2={y}
                  stroke="oklch(0.92 0.02 292 / 6%)"
                  strokeDasharray="2 6"
                />
                <text
                  x={left + geometry.plotWidth + 8}
                  y={y + 3}
                  fill="var(--muted-foreground)"
                  fontSize="9"
                >
                  {formatPrice(value)}
                </text>
              </g>
            );
          })}

          {Array.from(
            new Set(
              [0, 1, 2, 3, 4].map((index) =>
                Math.round(((data.length - 1) * index) / 4),
              ),
            ),
          ).map((index) => {
            const point = data[index];
            const x = left + geometry.step * (index + 0.5);

            return (
              <text
                key={index}
                x={x}
                y={height - 6}
                textAnchor="middle"
                fill="var(--muted-foreground)"
                fontSize="9"
              >
                {formatAxisDate(point.timestamp, range)}
              </text>
            );
          })}

          {data.map((point, index) => {
            const x = left + geometry.step * (index + 0.5);
            const openY = geometry.y(point.open);
            const closeY = geometry.y(point.close);
            const highY = geometry.y(point.high);
            const lowY = geometry.y(point.low);
            const positive = point.close >= point.open;
            const bodyY = Math.min(openY, closeY);
            const bodyHeight = Math.max(1.5, Math.abs(closeY - openY));
            const color = positive ? "var(--positive)" : "var(--negative)";

            return (
              <g key={`${point.timestamp}-${index}`}>
                <line
                  x1={x}
                  x2={x}
                  y1={highY}
                  y2={lowY}
                  stroke={color}
                  strokeWidth={1}
                  opacity={0.8}
                />
                <rect
                  x={x - geometry.candleWidth / 2}
                  y={bodyY}
                  width={geometry.candleWidth}
                  height={bodyHeight}
                  rx={0.7}
                  fill={color}
                  opacity={hoveredIndex === index ? 1 : 0.82}
                />
              </g>
            );
          })}

          {hoveredIndex !== null ? (
            <line
              x1={left + geometry.step * (hoveredIndex + 0.5)}
              x2={left + geometry.step * (hoveredIndex + 0.5)}
              y1={top}
              y2={top + geometry.plotHeight}
              stroke="var(--calyrn-ice)"
              strokeOpacity={0.22}
              strokeDasharray="3 5"
            />
          ) : null}
        </svg>
      ) : null}
    </div>
  );
}

export function PriceChart({
  coinId,
  symbol,
  data,
}: {
  coinId: string;
  symbol: string;
  data: PricePoint[];
}) {
  const [range, setRange] = useState<PriceHistoryRange>("7d");
  const [mode, setMode] = useState<ChartMode>("line");
  const [priceCache, setPriceCache] = useState<
    Partial<Record<PriceHistoryRange, PricePoint[]>>
  >({ "7d": data });
  const [ohlcCache, setOhlcCache] = useState<
    Partial<Record<PriceHistoryRange, OhlcPoint[]>>
  >({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const activePriceData = priceCache[range] ?? [];
  const activeOhlcData = ohlcCache[range] ?? [];
  const hasActiveData =
    mode === "line" ? activePriceData.length > 0 : activeOhlcData.length > 0;

  async function ensureDataset(
    nextRange: PriceHistoryRange,
    nextMode: ChartMode,
  ) {
    const cached =
      nextMode === "line" ? priceCache[nextRange] : ohlcCache[nextRange];

    if (cached) {
      setError(null);
      return;
    }

    const currentRequest = ++requestId.current;
    setLoading(true);
    setError(null);

    try {
      const endpoint = nextMode === "line" ? "price-history" : "ohlc";
      const response = await fetch(
        `/api/coins/${encodeURIComponent(coinId)}/${endpoint}?range=${nextRange}`,
        { cache: "no-store" },
      );

      if (!response.ok) {
        throw new Error("Chart data is unavailable for this selection.");
      }

      if (nextMode === "line") {
        const history = (await response.json()) as PricePoint[];
        setPriceCache((current) => ({
          ...current,
          [nextRange]: history,
        }));
      } else {
        const history = (await response.json()) as OhlcPoint[];
        setOhlcCache((current) => ({
          ...current,
          [nextRange]: history,
        }));
      }
    } catch (caught) {
      if (currentRequest === requestId.current) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Chart data is temporarily unavailable.",
        );
      }
    } finally {
      if (currentRequest === requestId.current) {
        setLoading(false);
      }
    }
  }

  function selectRange(nextRange: PriceHistoryRange) {
    if (nextRange === range) return;
    setRange(nextRange);
    void ensureDataset(nextRange, mode);
  }

  function selectMode(nextMode: ChartMode) {
    if (nextMode === mode) return;
    setMode(nextMode);
    void ensureDataset(range, nextMode);
  }

  return (
    <section className="spectral-panel spectral-edge min-w-0 rounded-3xl">
      <div className="flex flex-col gap-4 border-b border-white/[0.06] px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="data-label">Price structure</div>
          <div className="mt-1 flex items-center gap-2">
            <h2 className="font-heading text-base font-medium tracking-[-0.025em]">
              {symbol} / USD
            </h2>
            <Activity className="size-3.5 text-[var(--spectral-glacier)]" />
          </div>
          <p className="mt-1.5 text-[10px] leading-5 text-muted-foreground">
            {chartDescription(mode, range)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl border border-white/[0.07] bg-black/10 p-1 font-mono text-[9px] uppercase tracking-[0.08em]">
            {ranges.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => selectRange(item.value)}
                aria-pressed={range === item.value}
                className={
                  range === item.value
                    ? "rounded-lg bg-white/[0.08] px-2.5 py-1.5 text-foreground"
                    : "rounded-lg px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground"
                }
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 rounded-xl border border-white/[0.07] bg-black/10 p-1">
            <button
              type="button"
              onClick={() => selectMode("line")}
              aria-pressed={mode === "line"}
              title="Line chart"
              className={
                mode === "line"
                  ? "flex size-7 items-center justify-center rounded-lg bg-white/[0.08] text-foreground"
                  : "flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground"
              }
            >
              <ChartLine className="size-3.5" />
              <span className="sr-only">Line chart</span>
            </button>
            <button
              type="button"
              onClick={() => selectMode("candles")}
              aria-pressed={mode === "candles"}
              title="Candlestick chart"
              className={
                mode === "candles"
                  ? "flex size-7 items-center justify-center rounded-lg bg-white/[0.08] text-foreground"
                  : "flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground"
              }
            >
              <ChartCandlestickIcon className="size-3.5" />
              <span className="sr-only">Candlestick chart</span>
            </button>
          </div>
        </div>
      </div>

      <div className="relative px-2 pb-4 pt-5 sm:px-4">
        {loading && !hasActiveData ? (
          <div className="flex h-[390px] items-center justify-center text-xs text-muted-foreground">
            Loading {range.toUpperCase()}{" "}
            {mode === "line" ? "history" : "candles"}…
          </div>
        ) : error && !hasActiveData ? (
          <div className="flex h-[390px] items-center justify-center px-6 text-center text-xs text-muted-foreground">
            {error}
          </div>
        ) : mode === "candles" ? (
          <CandlestickChart data={activeOhlcData} range={range} />
        ) : activePriceData.length > 0 ? (
          <div className="h-[390px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={activePriceData}
                margin={{ top: 12, right: 12, left: 2, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="coin-price-fill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
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
                  tickFormatter={(value) =>
                    formatAxisDate(Number(value), range)
                  }
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
                  cursor={{
                    stroke: "var(--spectral-glacier)",
                    strokeOpacity: 0.18,
                  }}
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
                  animationDuration={450}
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

        {loading && hasActiveData ? (
          <div className="pointer-events-none absolute right-5 top-7 rounded-full border border-white/[0.07] bg-background/70 px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.08em] text-muted-foreground backdrop-blur-md">
            Updating…
          </div>
        ) : null}
      </div>
    </section>
  );
}
