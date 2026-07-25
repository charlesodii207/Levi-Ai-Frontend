"use client";

import { useState, useEffect, useRef } from "react";
import {
  motion,
  AnimatePresence,
} from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  RefreshCw,
  Zap,
  Gauge,
  Sparkles,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { LeviModel } from "./PromptBox";

const TIMEFRAMES = ["15m", "1h", "4h", "1d"];

const BINANCE_INTERVALS: Record<string, string> = {
  "15m": "15m",
  "1h": "1h",
  "4h": "4h",
  "1d": "1d",
};

const POPULAR_PAIRS = [
  "BTC/USDT",
  "ETH/USDT",
  "SOL/USDT",
  "BNB/USDT",
  "XRP/USDT",
  "DOGE/USDT",
  "ADA/USDT",
  "AVAX/USDT",
  "MATIC/USDT",
  "LINK/USDT",
  "DOT/USDT",
  "LTC/USDT",
];

const AUTO_REFRESH_OPTIONS = [
  { label: "30s", seconds: 30 },
  { label: "1m", seconds: 60 },
  { label: "5m", seconds: 300 },
];

const MODEL_OPTIONS: { id: LeviModel; label: string }[] = [
  { id: "swift", label: "Levi Swift" },
  { id: "nova", label: "Levi Nova" },
];

type Bias = "BULLISH" | "BEARISH" | "NEUTRAL";

type Analysis = {
  trend: Bias;
  confidence: number;
  indicators: string[];
  entry: string;
  stopLoss: string;
  takeProfit: string;
  riskReward: string;
  summary: string;
  novaInsight?: string;
};

type Candle = {
  open: number;
  high: number;
  low: number;
  close: number;
  time: string;
};

type LiveData = {
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  candles: Candle[];
};

type TFBias = {
  tf: string;
  bias: Bias;
};

// ---------------------------------------------------------------------------
// Live price card data (fetched directly from the browser — this is separate
// from the backend's own Kraken-based analysis and is just used for the
// top price ticker card, so it stays on Binance since it runs client-side
// and isn't blocked the way server-side Render requests are).
// ---------------------------------------------------------------------------

async function fetchLiveData(
  pair: string,
  interval: string
): Promise<LiveData> {
  const symbol = pair.replace("/", "").toUpperCase();

  const tickerRes = await fetch(
    `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`
  );

  if (!tickerRes.ok) {
    throw new Error(`Pair "${pair}" not found on Binance`);
  }

  const ticker = await tickerRes.json();

  const candleRes = await fetch(
    `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=50`
  );

  if (!candleRes.ok) {
    throw new Error("Failed to fetch candle data from Binance");
  }

  const rawCandles = await candleRes.json();

  const candles: Candle[] = rawCandles
    .slice(-20)
    .map((c: any[]) => ({
      open: parseFloat(c[1]),
      high: parseFloat(c[2]),
      low: parseFloat(c[3]),
      close: parseFloat(c[4]),
      time: new Date(c[0]).toISOString(),
    }));

  return {
    price: parseFloat(ticker.lastPrice),
    change24h: parseFloat(ticker.priceChangePercent),
    high24h: parseFloat(ticker.highPrice),
    low24h: parseFloat(ticker.lowPrice),
    volume24h: parseFloat(ticker.volume),
    candles,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(price: number): string {
  if (price >= 1000) {
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  if (price >= 1) {
    return price.toFixed(4);
  }

  return price.toFixed(6);
}

function biasColor(bias: Bias): string {
  if (bias === "BULLISH") return "#22c55e";
  if (bias === "BEARISH") return "#ef4444";
  return "#f59e0b";
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function CryptoAnalyzer() {
  const [pair, setPair] = useState("BTC/USDT");
  const [timeframe, setTimeframe] = useState("4h");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const [analysis, setAnalysis] =
    useState<Analysis | null>(null);

  const [liveData, setLiveData] =
    useState<LiveData | null>(null);

  const [mtfBias, setMtfBias] =
    useState<TFBias[] | null>(null);

  const [error, setError] = useState("");

  const [showSuggestions, setShowSuggestions] =
    useState(false);

  const [selectedModel, setSelectedModel] =
    useState<LeviModel>("nova");

  const [autoRefresh, setAutoRefresh] =
    useState(false);

  const [autoRefreshSeconds, setAutoRefreshSeconds] =
    useState(60);

  const [showAutoRefreshMenu, setShowAutoRefreshMenu] =
    useState(false);

  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);

  const handleAnalyzeRef =
    useRef<() => void>(() => {});

  const filteredPairs = pair
    ? POPULAR_PAIRS.filter((p) =>
        p.toLowerCase().includes(pair.toLowerCase())
      )
    : POPULAR_PAIRS;

  async function handleAnalyze() {
    if (!pair.trim()) {
      setError("Please enter a trading pair.");
      return;
    }

    setLoading(true);
    setFetching(true);
    setError("");

    setAnalysis(null);
    setLiveData(null);
    setMtfBias(null);

    try {
      // ---------------------------------------------------------------
      // STEP 1: Fetch live price card data (Binance, client-side only —
      // purely cosmetic for the ticker card at the top of the page)
      // ---------------------------------------------------------------

      const data = await fetchLiveData(
        pair,
        BINANCE_INTERVALS[timeframe]
      );

      setLiveData(data);
      setFetching(false);

      // ---------------------------------------------------------------
      // STEP 2: SEND TO DEDICATED CRYPTO BACKEND ENDPOINT
      //
      // The backend does everything itself: fetches live Kraken OHLCV,
      // computes real indicators (RSI/MACD/EMA/ATR/Bollinger), builds
      // the multi-timeframe confluence, prompts Levi AI, validates the
      // AI's JSON output, and returns one clean structured object.
      // There is no separate "text to re-parse" step on this end.
      // ---------------------------------------------------------------

      const token =
        localStorage.getItem("levi_token");

      const res = await fetch(
        "https://levi-ai-1ug2.onrender.com/crypto/analyze",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",

            ...(token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {}),
          },

          body: JSON.stringify({
            pair: pair.toUpperCase(),
            timeframe,
            model: selectedModel,
          }),
        }
      );

      if (!res.ok) {
        const errorData =
          await res.json().catch(() => null);

        throw new Error(
          errorData?.detail ||
            `Crypto analysis failed with status ${res.status}`
        );
      }

      const responseData = await res.json();

      const isNova = selectedModel === "nova";

      // ---------------------------------------------------------------
      // STEP 3: Render analysis directly from the backend's response
      // ---------------------------------------------------------------

      setAnalysis({
        trend: responseData.trend,
        confidence:
          typeof responseData.confidence === "number"
            ? responseData.confidence
            : 50,

        indicators: Array.isArray(responseData.indicators)
          ? responseData.indicators
          : [],

        entry: responseData.entry,
        stopLoss: responseData.stopLoss,
        takeProfit: responseData.takeProfit,
        riskReward: responseData.riskReward,
        summary: responseData.summary,

        novaInsight: isNova
          ? responseData.novaInsight
          : undefined,
      });

      // ---------------------------------------------------------------
      // STEP 4: Multi-timeframe confluence — this comes straight from
      // the backend's own indicator-based scoring (real RSI/MACD/EMA
      // math per timeframe), not a rough client-side approximation.
      // ---------------------------------------------------------------

      if (responseData.mtfBias) {
        setMtfBias(
          TIMEFRAMES.map((tf) => ({
            tf,
            bias: (responseData.mtfBias[tf] || "NEUTRAL") as Bias,
          }))
        );
      }

      setLastUpdated(new Date());

    } catch (e: any) {
      setError(
        e.message ||
          "Analysis failed. Check the pair name and try again."
      );

      setFetching(false);
    } finally {
      setLoading(false);
    }
  }

  // ---------------------------------------------------------------
  // Auto-refresh
  // ---------------------------------------------------------------

  useEffect(() => {
    handleAnalyzeRef.current =
      handleAnalyze;
  });

  useEffect(() => {
    if (!autoRefresh) return;

    const id = setInterval(() => {
      handleAnalyzeRef.current();
    }, autoRefreshSeconds * 1000);

    return () =>
      clearInterval(id);
  }, [
    autoRefresh,
    autoRefreshSeconds,
  ]);

  const trendColor = analysis
    ? biasColor(analysis.trend)
    : "#22c55e";

  const TrendIcon =
    analysis?.trend === "BULLISH"
      ? TrendingUp
      : analysis?.trend === "BEARISH"
      ? TrendingDown
      : Minus;

  return (
    <div
      style={{
        height: "100%",
        overflowY: "auto",
        padding: "28px 24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 820,
          margin: "0 auto",
        }}
      >

        {/* Header */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent:
              "space-between",
            marginBottom: 24,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background:
                  "rgba(34,197,94,0.12)",
                border:
                  "1px solid rgba(34,197,94,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "center",
              }}
            >
              <TrendingUp
                size={18}
                color="#22c55e"
              />
            </div>

            <div>
              <h1
                style={{
                  color: "white",
                  fontSize: 20,
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                Live Trading Analyzer
              </h1>

              <p
                style={{
                  color: "#4B5563",
                  fontSize: 13,
                  margin: 0,
                }}
              >
                Real-time market data ·
                AI-powered analysis by Levi
              </p>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {/* Model selector */}

            <div
              style={{
                display: "flex",
                background:
                  "rgba(255,255,255,0.03)",
                border:
                  "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10,
                padding: 3,
              }}
            >
              {MODEL_OPTIONS.map(
                (opt) => {
                  const active =
                    selectedModel ===
                    opt.id;

                  return (
                    <button
                      key={opt.id}
                      onClick={() =>
                        setSelectedModel(
                          opt.id
                        )
                      }
                      style={{
                        display: "flex",
                        alignItems:
                          "center",
                        gap: 5,
                        padding:
                          "6px 10px",
                        background:
                          active
                            ? "rgba(59,130,246,0.15)"
                            : "transparent",
                        border: "none",
                        borderRadius: 7,
                        color: active
                          ? "#3B82F6"
                          : "#6B7280",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor:
                          "pointer",
                      }}
                    >
                      {opt.id ===
                        "nova" && (
                        <Sparkles
                          size={11}
                        />
                      )}

                      {opt.label}
                    </button>
                  );
                }
              )}
            </div>

            {/* Auto-refresh */}

            <div
              style={{
                position:
                  "relative",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems:
                    "center",
                  gap: 8,
                }}
              >
                {autoRefresh && (
                  <button
                    onClick={() =>
                      setShowAutoRefreshMenu(
                        !showAutoRefreshMenu
                      )
                    }
                    onBlur={() =>
                      setTimeout(
                        () =>
                          setShowAutoRefreshMenu(
                            false
                          ),
                        150
                      )
                    }
                    style={{
                      padding:
                        "6px 10px",
                      background:
                        "rgba(34,197,94,0.08)",
                      border:
                        "1px solid rgba(34,197,94,0.25)",
                      borderRadius: 8,
                      color:
                        "#22c55e",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor:
                        "pointer",
                    }}
                  >
                    every{" "}
                    {
                      AUTO_REFRESH_OPTIONS.find(
                        (o) =>
                          o.seconds ===
                          autoRefreshSeconds
                      )?.label
                    }
                  </button>
                )}

                <button
                  onClick={() =>
                    setAutoRefresh(
                      !autoRefresh
                    )
                  }
                  title={
                    autoRefresh
                      ? "Auto-refresh on"
                      : "Auto-refresh off"
                  }
                  style={{
                    display: "flex",
                    alignItems:
                      "center",
                    gap: 6,
                    padding:
                      "7px 12px",
                    background:
                      autoRefresh
                        ? "rgba(34,197,94,0.12)"
                        : "rgba(255,255,255,0.04)",
                    border: `1px solid ${
                      autoRefresh
                        ? "rgba(34,197,94,0.35)"
                        : "rgba(255,255,255,0.08)"
                    }`,
                    borderRadius: 10,
                    color:
                      autoRefresh
                        ? "#22c55e"
                        : "#6B7280",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor:
                      "pointer",
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius:
                        "50%",
                      background:
                        autoRefresh
                          ? "#22c55e"
                          : "#374151",
                      boxShadow:
                        autoRefresh
                          ? "0 0 6px #22c55e"
                          : "none",
                    }}
                  />

                  Auto-refresh
                </button>
              </div>

              <AnimatePresence>
                {showAutoRefreshMenu &&
                  autoRefresh && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        y: -4,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      exit={{
                        opacity: 0,
                      }}
                      style={{
                        position:
                          "absolute",
                        top: "100%",
                        right: 0,
                        background:
                          "#0D1117",
                        border:
                          "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 10,
                        marginTop: 6,
                        zIndex: 10,
                        minWidth: 100,
                      }}
                    >
                      {AUTO_REFRESH_OPTIONS.map(
                        (opt) => (
                          <button
                            key={
                              opt.seconds
                            }
                            onClick={() => {
                              setAutoRefreshSeconds(
                                opt.seconds
                              );
                              setShowAutoRefreshMenu(
                                false
                              );
                            }}
                            style={{
                              width:
                                "100%",
                              padding:
                                "8px 12px",
                              background:
                                autoRefreshSeconds ===
                                opt.seconds
                                  ? "rgba(34,197,94,0.1)"
                                  : "transparent",
                              border:
                                "none",
                              borderBottom:
                                "1px solid rgba(255,255,255,0.04)",
                              color:
                                autoRefreshSeconds ===
                                opt.seconds
                                  ? "#22c55e"
                                  : "#9CA3AF",
                              fontSize: 12,
                              textAlign:
                                "left",
                              cursor:
                                "pointer",
                            }}
                          >
                            Every{" "}
                            {opt.label}
                          </button>
                        )
                      )}
                    </motion.div>
                  )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Input Card */}

        <div
          style={{
            background: "#0D1117",
            border:
              "1px solid rgba(255,255,255,0.06)",
            borderRadius: 20,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "1fr 1fr",
              gap: 16,
              marginBottom: 20,
            }}
          >
            {/* Pair */}

            <div
              style={{
                position:
                  "relative",
              }}
            >
              <label
                style={{
                  color: "#6B7280",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: 0.5,
                  display: "block",
                  marginBottom: 8,
                }}
              >
                TRADING PAIR
              </label>

              <input
                value={pair}
                onChange={(e) => {
                  setPair(
                    e.target.value
                  );
                  setShowSuggestions(
                    true
                  );
                }}
                onBlur={() =>
                  setTimeout(
                    () =>
                      setShowSuggestions(
                        false
                      ),
                    150
                  )
                }
                onFocus={() =>
                  setShowSuggestions(
                    true
                  )
                }
                placeholder="e.g. BTC/USDT"
                style={{
                  width: "100%",
                  background: "#080A10",
                  border:
                    "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  padding:
                    "12px 14px",
                  color: "white",
                  fontSize: 15,
                  fontWeight: 600,
                  outline: "none",
                  fontFamily:
                    "Inter, sans-serif",
                }}
              />

              <AnimatePresence>
                {showSuggestions &&
                  filteredPairs.length >
                    0 && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        y: -4,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      exit={{
                        opacity: 0,
                      }}
                      style={{
                        position:
                          "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        background:
                          "#0D1117",
                        border:
                          "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 12,
                        marginTop: 4,
                        zIndex: 10,
                        maxHeight: 200,
                        overflowY:
                          "auto",
                      }}
                    >
                      {filteredPairs.map(
                        (p) => (
                          <button
                            key={p}
                            onClick={() => {
                              setPair(p);
                              setShowSuggestions(
                                false
                              );
                            }}
                            style={{
                              width:
                                "100%",
                              padding:
                                "10px 14px",
                              background:
                                "transparent",
                              border:
                                "none",
                              borderBottom:
                                "1px solid rgba(255,255,255,0.04)",
                              color:
                                "#9CA3AF",
                              fontSize: 13,
                              textAlign:
                                "left",
                              cursor:
                                "pointer",
                            }}
                          >
                            {p}
                          </button>
                        )
                      )}
                    </motion.div>
                  )}
              </AnimatePresence>
            </div>

            {/* Timeframe */}

            <div>
              <label
                style={{
                  color: "#6B7280",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: 0.5,
                  display: "block",
                  marginBottom: 8,
                }}
              >
                TIMEFRAME
              </label>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                }}
              >
                {TIMEFRAMES.map(
                  (tf) => (
                    <button
                      key={tf}
                      onClick={() =>
                        setTimeframe(
                          tf
                        )
                      }
                      style={{
                        flex: 1,
                        padding:
                          "12px 8px",
                        background:
                          timeframe ===
                          tf
                            ? "rgba(34,197,94,0.12)"
                            : "#080A10",
                        border: `1px solid ${
                          timeframe ===
                          tf
                            ? "rgba(34,197,94,0.4)"
                            : "rgba(255,255,255,0.06)"
                        }`,
                        borderRadius: 10,
                        color:
                          timeframe ===
                          tf
                            ? "#22c55e"
                            : "#6B7280",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor:
                          "pointer",
                        transition:
                          "all 0.15s",
                      }}
                    >
                      {tf.toUpperCase()}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          {error && (
            <p
              style={{
                color: "#ef4444",
                fontSize: 13,
                marginBottom: 14,
                padding:
                  "10px 14px",
                background:
                  "rgba(239,68,68,0.08)",
                borderRadius: 8,
              }}
            >
              ⚠ {error}
            </p>
          )}

          <button
            onClick={handleAnalyze}
            disabled={loading}
            style={{
              width: "100%",
              padding: 14,
              background: loading
                ? "#0a0c12"
                : "linear-gradient(135deg, #16a34a, #22c55e)",
              border: "none",
              borderRadius: 12,
              color: loading
                ? "#4B5563"
                : "white",
              fontSize: 15,
              fontWeight: 700,
              cursor: loading
                ? "not-allowed"
                : "pointer",
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              gap: 8,
              boxShadow: loading
                ? "none"
                : "0 4px 20px rgba(34,197,94,0.2)",
              transition:
                "all 0.2s",
            }}
          >
            {loading ? (
              <>
                <Loader2
                  size={16}
                  style={{
                    animation:
                      "spin 1s linear infinite",
                  }}
                />

                {fetching
                  ? `Fetching live ${pair} data...`
                  : "Analyzing with AI..."}
              </>
            ) : (
              <>
                <Zap size={16} />
                Analyze Live Market
              </>
            )}
          </button>

          {lastUpdated &&
            !loading && (
              <p
                style={{
                  color: "#374151",
                  fontSize: 11,
                  textAlign:
                    "center",
                  marginTop: 10,
                  marginBottom: 0,
                }}
              >
                Last updated{" "}
                {lastUpdated.toLocaleTimeString()}

                {autoRefresh &&
                  ` · auto-refreshing every ${
                    AUTO_REFRESH_OPTIONS.find(
                      (o) =>
                        o.seconds ===
                        autoRefreshSeconds
                    )?.label
                  }`}
              </p>
            )}
        </div>

        {/* Live Price Card */}

        <AnimatePresence>
          {liveData && (
            <motion.div
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              style={{
                background: "#0D1117",
                border:
                  "1px solid rgba(255,255,255,0.06)",
                borderRadius: 16,
                padding:
                  "16px 20px",
                marginBottom: 16,
                display: "grid",
                gridTemplateColumns:
                  "repeat(4, 1fr)",
                gap: 16,
              }}
            >
              {[
                {
                  label:
                    "LIVE PRICE",
                  value: `$${formatPrice(
                    liveData.price
                  )}`,
                  color: "white",
                },
                {
                  label:
                    "24H CHANGE",
                  value: `${
                    liveData.change24h >=
                    0
                      ? "+"
                      : ""
                  }${liveData.change24h.toFixed(
                    2
                  )}%`,
                  color:
                    liveData.change24h >=
                    0
                      ? "#22c55e"
                      : "#ef4444",
                },
                {
                  label:
                    "24H HIGH",
                  value: `$${formatPrice(
                    liveData.high24h
                  )}`,
                  color:
                    "#22c55e",
                },
                {
                  label:
                    "24H LOW",
                  value: `$${formatPrice(
                    liveData.low24h
                  )}`,
                  color:
                    "#ef4444",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    textAlign:
                      "center",
                  }}
                >
                  <p
                    style={{
                      color:
                        "#4B5563",
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: 0.5,
                      margin:
                        "0 0 6px",
                    }}
                  >
                    {item.label}
                  </p>

                  <p
                    style={{
                      color:
                        item.color,
                      fontSize: 15,
                      fontWeight: 700,
                      margin: 0,
                    }}
                  >
                    {item.value}
                  </p>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Multi-timeframe confluence */}

        <AnimatePresence>
          {mtfBias && (
            <motion.div
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              style={{
                background: "#0D1117",
                border:
                  "1px solid rgba(255,255,255,0.06)",
                borderRadius: 16,
                padding:
                  "14px 20px",
                marginBottom: 16,
              }}
            >
              <p
                style={{
                  color:
                    "#4B5563",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: 0.5,
                  margin:
                    "0 0 10px",
                }}
              >
                TIMEFRAME CONFLUENCE
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(4, 1fr)",
                  gap: 10,
                }}
              >
                {mtfBias.map(
                  (item) => {
                    const color =
                      biasColor(
                        item.bias
                      );

                    const isActive =
                      item.tf ===
                      timeframe;

                    return (
                      <div
                        key={
                          item.tf
                        }
                        style={{
                          background: `${color}0F`,
                          border: `1px solid ${color}${
                            isActive
                              ? "50"
                              : "25"
                          }`,
                          borderRadius: 10,
                          padding:
                            "10px 6px",
                          textAlign:
                            "center",
                        }}
                      >
                        <p
                          style={{
                            color:
                              "#6B7280",
                            fontSize: 10,
                            fontWeight: 700,
                            margin:
                              "0 0 4px",
                          }}
                        >
                          {item.tf.toUpperCase()}
                          {isActive
                            ? " •"
                            : ""}
                        </p>

                        <p
                          style={{
                            color,
                            fontSize: 12,
                            fontWeight: 700,
                            margin: 0,
                          }}
                        >
                          {item.bias}
                        </p>
                      </div>
                    );
                  }
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Analysis Output */}

        <AnimatePresence>
          {analysis && (
            <motion.div
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.4,
              }}
            >
              {/* Trend Banner */}

              <div
                style={{
                  background: `${trendColor}10`,
                  border: `1px solid ${trendColor}30`,
                  borderRadius: 16,
                  padding:
                    "16px 20px",
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "space-between",
                  }}
                >
                  <div
                    style={{
                      display:
                        "flex",
                      alignItems:
                        "center",
                      gap: 12,
                    }}
                  >
                    <TrendIcon
                      size={28}
                      color={
                        trendColor
                      }
                    />

                    <div>
                      <p
                        style={{
                          color:
                            trendColor,
                          fontSize: 22,
                          fontWeight: 800,
                          margin: 0,
                        }}
                      >
                        {
                          analysis.trend
                        }
                      </p>

                      <p
                        style={{
                          color:
                            "#6B7280",
                          fontSize: 12,
                          margin: 0,
                        }}
                      >
                        {pair.toUpperCase()} ·{" "}
                        {timeframe.toUpperCase()} ·{" "}
                        Live Analysis
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={
                      handleAnalyze
                    }
                    style={{
                      background:
                        "rgba(255,255,255,0.05)",
                      border:
                        "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 10,
                      padding:
                        "8px 14px",
                      color:
                        "#6B7280",
                      fontSize: 12,
                      cursor:
                        "pointer",
                      display:
                        "flex",
                      alignItems:
                        "center",
                      gap: 6,
                    }}
                  >
                    <RefreshCw
                      size={12}
                    />
                    Refresh
                  </button>
                </div>

                {/* Confidence meter */}

                <div
                  style={{
                    marginTop: 14,
                  }}
                >
                  <div
                    style={{
                      display:
                        "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "space-between",
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        display:
                          "flex",
                        alignItems:
                          "center",
                        gap: 6,
                        color:
                          "#6B7280",
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: 0.5,
                      }}
                    >
                      <Gauge
                        size={12}
                      />
                      CONFIDENCE
                    </span>

                    <span
                      style={{
                        color:
                          trendColor,
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {
                        analysis.confidence
                      }%
                    </span>
                  </div>

                  <div
                    style={{
                      width: "100%",
                      height: 6,
                      background:
                        "rgba(255,255,255,0.06)",
                      borderRadius: 4,
                      overflow:
                        "hidden",
                    }}
                  >
                    <motion.div
                      initial={{
                        width: 0,
                      }}
                      animate={{
                        width: `${Math.max(
                          0,
                          Math.min(
                            100,
                            analysis.confidence
                          )
                        )}%`,
                      }}
                      transition={{
                        duration: 0.5,
                      }}
                      style={{
                        height: "100%",
                        background:
                          trendColor,
                        borderRadius: 4,
                      }}
                    />
                  </div>
                </div>

                {/* Indicator tags */}

                {analysis
                  .indicators
                  .length >
                  0 && (
                  <div
                    style={{
                      display:
                        "flex",
                      flexWrap:
                        "wrap",
                      gap: 6,
                      marginTop: 12,
                    }}
                  >
                    {analysis.indicators.map(
                      (
                        tag,
                        i
                      ) => (
                        <span
                          key={i}
                          style={{
                            padding:
                              "5px 10px",
                            background:
                              "rgba(255,255,255,0.05)",
                            border:
                              "1px solid rgba(255,255,255,0.08)",
                            borderRadius:
                              999,
                            color:
                              "#9CA3AF",
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          {
                            tag
                          }
                        </span>
                      )
                    )}
                  </div>
                )}
              </div>

              {/* Key Levels */}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "1fr 1fr 1fr 1fr",
                  gap: 10,
                  marginBottom: 14,
                }}
              >
                {[
                  {
                    label:
                      "ENTRY",
                    value:
                      analysis.entry,
                    color:
                      "#3b82f6",
                    bg: "rgba(59,130,246,0.08)",
                  },
                  {
                    label:
                      "STOP LOSS",
                    value:
                      analysis.stopLoss,
                    color:
                      "#ef4444",
                    bg: "rgba(239,68,68,0.08)",
                  },
                  {
                    label:
                      "TAKE PROFIT",
                    value:
                      analysis.takeProfit,
                    color:
                      "#22c55e",
                    bg: "rgba(34,197,94,0.08)",
                  },
                  {
                    label:
                      "RISK/REWARD",
                    value:
                      analysis.riskReward,
                    color:
                      "#D4AF37",
                    bg: "rgba(212,175,55,0.08)",
                  },
                ].map(
                  (item) => (
                    <div
                      key={
                        item.label
                      }
                      style={{
                        background:
                          item.bg,
                        border: `1px solid ${item.color}25`,
                        borderRadius: 14,
                        padding:
                          "14px 12px",
                        textAlign:
                          "center",
                      }}
                    >
                      <p
                        style={{
                          color:
                            "#4B5563",
                          fontSize: 10,
                          fontWeight: 600,
                          letterSpacing: 0.5,
                          margin:
                            "0 0 8px",
                        }}
                      >
                        {
                          item.label
                        }
                      </p>

                      <p
                        style={{
                          color:
                            item.color,
                          fontSize: 15,
                          fontWeight: 700,
                          margin: 0,
                        }}
                      >
                        {
                          item.value
                        }
                      </p>
                    </div>
                  )
                )}
              </div>

              {/* Analysis Summary */}

              <div
                style={{
                  background:
                    "#0D1117",
                  border:
                    "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 16,
                  padding:
                    "20px 24px",
                  marginBottom: 12,
                }}
              >
                <p
                  style={{
                    color:
                      "#4B5563",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: 0.5,
                    marginBottom: 14,
                  }}
                >
                  AI ANALYSIS
                </p>

                <div className="markdown-body">
                  <ReactMarkdown
                    remarkPlugins={[
                      remarkGfm,
                    ]}
                  >
                    {
                      analysis.summary
                    }
                  </ReactMarkdown>
                </div>
              </div>

              {/* Nova Insight */}

              {analysis.novaInsight && (
                <div
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(59,130,246,0.06), rgba(212,175,55,0.04))",
                    border:
                      "1px solid rgba(59,130,246,0.25)",
                    borderRadius: 16,
                    padding:
                      "20px 24px",
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      display:
                        "flex",
                      alignItems:
                        "center",
                      gap: 8,
                      marginBottom: 14,
                    }}
                  >
                    <Sparkles
                      size={14}
                      color="#3B82F6"
                    />

                    <p
                      style={{
                        color:
                          "#3B82F6",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: 0.5,
                        margin: 0,
                      }}
                    >
                      NOVA INSIGHT —
                      DEEPER ANALYSIS
                    </p>
                  </div>

                  <div className="markdown-body">
                    <ReactMarkdown
                      remarkPlugins={[
                        remarkGfm,
                      ]}
                    >
                      {
                        analysis.novaInsight
                      }
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              <p
                style={{
                  color:
                    "#374151",
                  fontSize: 11,
                  textAlign:
                    "center",
                }}
              >
                ⚠ AI analysis powered by live
                market data. Not financial
                advice. Always manage your
                risk.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <style>{`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    </div>
  );
}
