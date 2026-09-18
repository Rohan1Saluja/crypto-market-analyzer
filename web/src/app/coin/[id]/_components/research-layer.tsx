"use client";

import { useState } from "react";
import {
  Activity,
  ArrowUpRight,
  BookOpen,
  Code2,
  Database,
  ExternalLink,
  Gauge,
  GitFork,
  Newspaper,
  Radio,
  Star,
  Users,
} from "lucide-react";

import type {
  CoinDetail,
  CoinFundamentals,
  CoinNewsItem,
  CoinResearch,
  CoinSentiment,
  TechnicalSnapshot,
} from "@/types/coin";

type ResearchTab =
  | "overview"
  | "technicals"
  | "fundamentals"
  | "news"
  | "sentiment";

const tabs = [
  { id: "overview", label: "Overview", icon: BookOpen },
  { id: "technicals", label: "Technicals", icon: Gauge },
  { id: "fundamentals", label: "Fundamentals", icon: Database },
  { id: "news", label: "News", icon: Newspaper },
  { id: "sentiment", label: "Sentiment", icon: Users },
] as const;

function formatPrice(value: number | null) {
  if (value === null) {
    return "Unavailable";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value < 1 ? 4 : value < 100 ? 2 : 0,
  }).format(value);
}

function formatCompact(value: number | null) {
  if (value === null) {
    return "Unavailable";
  }

  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number | null, signed = false) {
  if (value === null) {
    return "Unavailable";
  }

  const prefix = signed && value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(1)}%`;
}

function formatDate(value: string | null) {
  if (!value) {
    return "Unavailable";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function signalClass(value: string) {
  if (value === "Bullish") {
    return "signal-positive";
  }

  if (value === "Bearish") {
    return "signal-negative";
  }

  return "signal-neutral";
}

function metricTone(value: number | null) {
  if (value === null || value === 0) {
    return "text-foreground/70";
  }

  return value > 0 ? "signal-positive" : "signal-negative";
}

function hasFundamentals(fundamentals: CoinFundamentals | undefined) {
  if (!fundamentals) {
    return false;
  }

  return Boolean(
    fundamentals.circulatingSupply !== null ||
      fundamentals.totalSupply !== null ||
      fundamentals.maxSupply !== null ||
      fundamentals.fullyDilutedValuation !== null ||
      fundamentals.allTimeHigh !== null ||
      fundamentals.allTimeLow !== null ||
      fundamentals.genesisDate ||
      fundamentals.hashingAlgorithm ||
      fundamentals.categories.length,
  );
}

function OverviewPanel({
  detail,
  research,
  technicals,
  news,
}: {
  detail: CoinDetail;
  research: CoinResearch | null;
  technicals: TechnicalSnapshot | null;
  news: CoinNewsItem[];
}) {
  const fundamentals = research?.fundamentals;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-1 duration-300">
      <div className="data-label">Asset brief</div>
      <p className="mt-3 max-w-4xl text-sm leading-7 text-foreground/76">
        {detail.description ??
          "Description unavailable from the market-data provider."}
      </p>

      {fundamentals?.categories.length ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {fundamentals.categories.map((category) => (
            <span
              key={category}
              className="rounded-full border border-white/[0.07] bg-white/[0.035] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.07em] text-foreground/65"
            >
              {category}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-7 grid gap-3 sm:grid-cols-3">
        <CoverageCard
          label="Technical model"
          value={technicals ? "Live" : "Limited"}
          helper={technicals ? "30d hourly signal set" : "Insufficient history"}
        />
        <CoverageCard
          label="Research profile"
          value={hasFundamentals(fundamentals) ? "Enriched" : "Basic"}
          helper="Supply, milestones and network metadata"
        />
        <CoverageCard
          label="News pulse"
          value={news.length ? `${news.length} stories` : "Quiet"}
          helper="Recent indexed coverage"
        />
      </div>

      {(fundamentals?.homepageUrl || fundamentals?.blockchainExplorerUrl) && (
        <div className="mt-6 flex flex-wrap gap-2 border-t border-white/[0.06] pt-5">
          {fundamentals.homepageUrl ? (
            <ExternalResearchLink href={fundamentals.homepageUrl} label="Official site" />
          ) : null}
          {fundamentals.blockchainExplorerUrl ? (
            <ExternalResearchLink
              href={fundamentals.blockchainExplorerUrl}
              label="Block explorer"
            />
          ) : null}
        </div>
      )}
    </div>
  );
}

function CoverageCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
      <div className="data-label text-[8px]!">{label}</div>
      <div className="mt-2 font-heading text-sm font-medium">{value}</div>
      <p className="mt-1 text-[10px] leading-5 text-muted-foreground">{helper}</p>
    </div>
  );
}

function ExternalResearchLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="group inline-flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.08em] text-foreground/70 transition-colors hover:border-white/[0.13] hover:bg-white/[0.055] hover:text-foreground"
    >
      {label}
      <ExternalLink className="size-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </a>
  );
}

function TechnicalsPanel({
  symbol,
  technicals,
}: {
  symbol: string;
  technicals: TechnicalSnapshot | null;
}) {
  if (!technicals) {
    return (
      <EmptyResearchState
        title="Technical model unavailable"
        body={`There is not enough historical data to calculate the deeper ${symbol} technical view right now.`}
      />
    );
  }

  const rsiPosition = `${Math.max(0, Math.min(100, technicals.rsi))}%`;
  const rsiState =
    technicals.rsi >= 70
      ? "Overbought zone"
      : technicals.rsi <= 30
        ? "Oversold zone"
        : "Neutral range";

  return (
    <div className="animate-in fade-in slide-in-from-bottom-1 duration-300">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ResearchMetric label="Momentum" value={technicals.momentum} tone={signalClass(technicals.momentum)} />
        <ResearchMetric label="MACD bias" value={technicals.macd} tone={signalClass(technicals.macd)} />
        <ResearchMetric label="Volatility" value={technicals.volatility} helper={`${technicals.volatilityAnnualized.toFixed(1)}% annualized`} />
        <ResearchMetric label="Timeframe" value={technicals.timeframe} helper="Calculated from hourly history" />
      </div>

      <div className="mt-7 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="data-label">Relative strength index</div>
            <div className="mt-1 text-xs text-muted-foreground">{rsiState}</div>
          </div>
          <div className="number-display font-heading text-xl font-medium">
            {technicals.rsi.toFixed(1)}
          </div>
        </div>
        <div className="mt-5 relative h-2 rounded-full bg-[linear-gradient(90deg,var(--negative)_0%,oklch(0.45_0.04_292)_50%,var(--positive)_100%)] opacity-80">
          <div
            className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--background)] bg-foreground shadow-[0_0_0_3px_rgba(255,255,255,0.06)] transition-[left] duration-500"
            style={{ left: rsiPosition }}
          />
        </div>
        <div className="mt-2 flex justify-between font-mono text-[8px] uppercase tracking-[0.07em] text-muted-foreground">
          <span>Oversold</span>
          <span>Neutral</span>
          <span>Overbought</span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <ResearchMetric label="Support zone" value={formatPrice(technicals.support)} />
        <ResearchMetric label="Resistance zone" value={formatPrice(technicals.resistance)} />
      </div>
    </div>
  );
}

function ResearchMetric({
  label,
  value,
  helper,
  tone = "text-foreground",
}: {
  label: string;
  value: string;
  helper?: string;
  tone?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
      <div className="data-label text-[8px]!">{label}</div>
      <div className={`mt-2 font-heading text-sm font-medium ${tone}`}>{value}</div>
      {helper ? (
        <div className="mt-1 font-mono text-[8px] uppercase tracking-[0.06em] text-muted-foreground">
          {helper}
        </div>
      ) : null}
    </div>
  );
}

function FundamentalsPanel({
  fundamentals,
}: {
  fundamentals: CoinFundamentals | undefined;
}) {
  if (!hasFundamentals(fundamentals) || !fundamentals) {
    return (
      <EmptyResearchState
        title="Fundamentals are limited"
        body="The upstream market-data profile does not currently expose enough supply or network metadata for this asset."
      />
    );
  }

  const supplyProgress =
    fundamentals.circulatingSupply !== null &&
    fundamentals.maxSupply !== null &&
    fundamentals.maxSupply > 0
      ? Math.min(100, (fundamentals.circulatingSupply / fundamentals.maxSupply) * 100)
      : null;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-1 duration-300">
      <div className="data-label">Supply structure</div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ResearchMetric label="Circulating" value={formatCompact(fundamentals.circulatingSupply)} />
        <ResearchMetric label="Total supply" value={formatCompact(fundamentals.totalSupply)} />
        <ResearchMetric label="Max supply" value={formatCompact(fundamentals.maxSupply)} />
        <ResearchMetric label="Fully diluted value" value={formatPrice(fundamentals.fullyDilutedValuation)} />
      </div>

      {supplyProgress !== null ? (
        <div className="mt-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="data-label text-[8px]!">Circulating vs max supply</span>
            <span className="number-display font-mono text-[10px] text-foreground/70">
              {supplyProgress.toFixed(1)}%
            </span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,var(--spectral-violet),var(--spectral-glacier))] transition-[width] duration-500"
              style={{ width: `${supplyProgress}%` }}
            />
          </div>
        </div>
      ) : null}

      <div className="mt-7 grid gap-5 lg:grid-cols-2">
        <div>
          <div className="data-label">Price milestones</div>
          <div className="mt-3 space-y-3">
            <MilestoneRow
              label="All-time high"
              value={formatPrice(fundamentals.allTimeHigh)}
              change={formatPercent(fundamentals.allTimeHighChangePercentage, true)}
              date={formatDate(fundamentals.allTimeHighDate)}
            />
            <MilestoneRow
              label="All-time low"
              value={formatPrice(fundamentals.allTimeLow)}
              change={formatPercent(fundamentals.allTimeLowChangePercentage, true)}
              date={formatDate(fundamentals.allTimeLowDate)}
            />
          </div>
        </div>

        <div>
          <div className="data-label">Network profile</div>
          <div className="mt-3 divide-y divide-white/[0.06] rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4">
            <FactRow label="Genesis" value={formatDate(fundamentals.genesisDate)} />
            <FactRow label="Consensus / hash" value={fundamentals.hashingAlgorithm ?? "Unavailable"} />
            <FactRow label="Categories" value={fundamentals.categories.slice(0, 3).join(" · ") || "Unavailable"} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MilestoneRow({
  label,
  value,
  change,
  date,
}: {
  label: string;
  value: string;
  change: string;
  date: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="data-label text-[8px]!">{label}</div>
          <div className="mt-2 number-display font-heading text-base font-medium">{value}</div>
        </div>
        <span className="font-mono text-[9px] text-foreground/60">{change}</span>
      </div>
      <div className="mt-3 font-mono text-[8px] uppercase tracking-[0.06em] text-muted-foreground">
        {date}
      </div>
    </div>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-5 py-3.5">
      <span className="data-label text-[8px]!">{label}</span>
      <span className="max-w-[65%] text-right text-xs leading-5 text-foreground/75">{value}</span>
    </div>
  );
}

function NewsPanel({
  name,
  news,
}: {
  name: string;
  news: CoinNewsItem[];
}) {
  if (!news.length) {
    const newsSearch = `https://news.google.com/search?q=${encodeURIComponent(`${name} cryptocurrency`)}`;

    return (
      <div className="animate-in fade-in slide-in-from-bottom-1 duration-300">
        <EmptyResearchState
          title="No recent stories returned"
          body="The live news feed is temporarily quiet or unavailable. You can still open a broader news search for this asset."
        />
        <a
          href={newsSearch}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.08em] text-foreground/70 transition-colors hover:bg-white/[0.055] hover:text-foreground"
        >
          Open news search
          <ArrowUpRight className="size-3" />
        </a>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-1 duration-300">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="data-label">Recent coverage</div>
          <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
            Indexed headlines open at their original publisher via Google News.
          </p>
        </div>
        <Radio className="size-3.5 text-[var(--spectral-glacier)]" />
      </div>

      <div className="mt-4 divide-y divide-white/[0.06] rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 sm:px-5">
        {news.map((item) => (
          <a
            key={`${item.url}-${item.title}`}
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="group flex gap-4 py-4 first:pt-4 last:pb-4"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[8px] uppercase tracking-[0.07em] text-muted-foreground">
                <span>{item.source}</span>
                {item.publishedAt ? <span>· {formatDate(item.publishedAt)}</span> : null}
              </div>
              <h3 className="mt-1.5 text-sm leading-6 text-foreground/82 transition-colors group-hover:text-foreground">
                {item.title}
              </h3>
            </div>
            <ArrowUpRight className="mt-1 size-3.5 shrink-0 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
          </a>
        ))}
      </div>
    </div>
  );
}

function SentimentPanel({
  sentiment,
  detail,
  technicals,
}: {
  sentiment: CoinSentiment | undefined;
  detail: CoinDetail;
  technicals: TechnicalSnapshot | null;
}) {
  const up = sentiment?.votesUpPercentage ?? null;
  const down = sentiment?.votesDownPercentage ?? null;
  const hasVotes = up !== null || down !== null;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-1 duration-300">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
        <div>
          <div className="data-label">Community vote</div>
          <div className="mt-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5">
            {hasVotes ? (
              <>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <div className="font-heading text-2xl font-medium signal-positive">
                      {formatPercent(up)}
                    </div>
                    <div className="mt-1 data-label text-[8px]!">Positive</div>
                  </div>
                  <div className="text-right">
                    <div className="font-heading text-2xl font-medium signal-negative">
                      {formatPercent(down)}
                    </div>
                    <div className="mt-1 data-label text-[8px]!">Negative</div>
                  </div>
                </div>
                <div className="mt-5 flex h-2 overflow-hidden rounded-full bg-white/[0.05]">
                  <div
                    className="h-full bg-[var(--positive)] transition-[width] duration-500"
                    style={{ width: `${Math.max(0, Math.min(100, up ?? 0))}%` }}
                  />
                  <div className="h-full flex-1 bg-[var(--negative)] opacity-75" />
                </div>
                <p className="mt-3 text-[10px] leading-5 text-muted-foreground">
                  Crowd voting is provider-reported and should be read as participation data, not a trading signal.
                </p>
              </>
            ) : (
              <p className="text-xs leading-6 text-muted-foreground">
                CoinGecko does not currently publish a crowd-vote sample for this asset.
              </p>
            )}
          </div>

          <div className="mt-5 data-label">Market pulse</div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <ResearchMetric
              label="24h price"
              value={formatPercent(detail.coin.change24h, true)}
              tone={metricTone(detail.coin.change24h)}
            />
            <ResearchMetric
              label="7d price"
              value={formatPercent(detail.coin.change7d, true)}
              tone={metricTone(detail.coin.change7d)}
            />
            <ResearchMetric
              label="Momentum"
              value={technicals?.momentum ?? "Unavailable"}
              tone={technicals ? signalClass(technicals.momentum) : "text-foreground/70"}
            />
          </div>
        </div>

        <div>
          <div className="data-label">Participation signals</div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <ParticipationMetric icon={Users} label="Watchlists" value={sentiment?.watchlistUsers ?? null} />
            <ParticipationMetric icon={Radio} label="Reddit" value={sentiment?.redditSubscribers ?? null} />
            <ParticipationMetric icon={Star} label="GitHub stars" value={sentiment?.githubStars ?? null} />
            <ParticipationMetric icon={GitFork} label="GitHub forks" value={sentiment?.githubForks ?? null} />
          </div>
          <div className="mt-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Code2 className="size-3.5 text-[var(--spectral-violet)]" />
                <span className="data-label text-[8px]!">Commits / 4 weeks</span>
              </div>
              <span className="number-display font-heading text-sm font-medium">
                {formatCompact(sentiment?.githubCommits4Weeks ?? null)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ParticipationMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity;
  label: string;
  value: number | null;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="data-label text-[8px]!">{label}</span>
        <Icon className="size-3 text-muted-foreground" />
      </div>
      <div className="mt-3 number-display font-heading text-sm font-medium">
        {formatCompact(value)}
      </div>
    </div>
  );
}

function EmptyResearchState({ title, body }: { title: string; body: string }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-1 rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.02] p-5 duration-300">
      <div className="font-heading text-sm font-medium">{title}</div>
      <p className="mt-2 max-w-2xl text-xs leading-6 text-muted-foreground">{body}</p>
    </div>
  );
}

export function ResearchLayer({
  detail,
  research,
  technicals,
  news,
}: {
  detail: CoinDetail;
  research: CoinResearch | null;
  technicals: TechnicalSnapshot | null;
  news: CoinNewsItem[];
}) {
  const [activeTab, setActiveTab] = useState<ResearchTab>("overview");

  return (
    <section className="spectral-panel spectral-edge mt-5 rounded-3xl px-5 py-5 sm:px-6 sm:py-6">
      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">
        <div>
          <div className="data-label">Research layer</div>
          <h2 className="mt-1 font-heading text-base font-medium tracking-[-0.025em]">
            About {detail.coin.name}
          </h2>
          <p className="mt-1.5 text-[10px] leading-5 text-muted-foreground">
            Market, network, news and participation context in one surface.
          </p>

          <div
            role="tablist"
            aria-label={`${detail.coin.name} research sections`}
            className="mt-4 flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:items-stretch lg:overflow-visible lg:pb-0"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  id={`research-tab-${tab.id}`}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`research-panel-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={
                    isActive
                      ? "group flex shrink-0 items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.07] px-3 py-2 text-left font-mono text-[9px] uppercase tracking-[0.08em] text-foreground transition-all duration-200 lg:w-full"
                      : "group flex shrink-0 items-center gap-2 rounded-xl border border-transparent px-3 py-2 text-left font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground transition-all duration-200 hover:border-white/[0.05] hover:bg-white/[0.03] hover:text-foreground/80 lg:w-full"
                  }
                >
                  <Icon
                    className={
                      isActive
                        ? "size-3 text-[var(--spectral-violet)]"
                        : "size-3 text-muted-foreground transition-colors group-hover:text-foreground/65"
                    }
                  />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div
          id={`research-panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`research-tab-${activeTab}`}
          className="min-w-0 border-t border-white/[0.06] pt-5 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0"
        >
          {activeTab === "overview" ? (
            <OverviewPanel detail={detail} research={research} technicals={technicals} news={news} />
          ) : null}
          {activeTab === "technicals" ? (
            <TechnicalsPanel symbol={detail.coin.symbol} technicals={technicals} />
          ) : null}
          {activeTab === "fundamentals" ? (
            <FundamentalsPanel fundamentals={research?.fundamentals} />
          ) : null}
          {activeTab === "news" ? (
            <NewsPanel name={detail.coin.name} news={news} />
          ) : null}
          {activeTab === "sentiment" ? (
            <SentimentPanel
              sentiment={research?.sentiment}
              detail={detail}
              technicals={technicals}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
