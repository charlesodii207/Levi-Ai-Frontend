"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Loader2, RefreshCw, Zap, Gauge } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const TIMEFRAMES = ["15m", "1h", "4h", "1d"];

const BINANCE_INTERVALS: Record<string, string> = {
  "15m": "15m",
  "1h": "1h",
  "4h": "4h",
  "1d": "1d",
};

const POPULAR_PAIRS = [
  "BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT",
  "XRP/USDT", "DOGE/USDT", "ADA/USDT", "AVAX/USDT",
  "MATIC/USDT", "LINK/USDT", "DOT/USDT", "LTC/USDT",
];

const AUTO_REFRESH_OPTIONS = [
  { label: "30s", seconds: 30 },
  { label: "1m", seconds: 60 },
  { label: "5m", seconds: 300 },
];

type Bias = "BULLISH" | "BEARISH" | "NEUTRAL";

type Analysis = {
  trend: Bias;
  confidence: number; // 0-100
  indicators: string[];
  entry: string;
  stopLoss: string;
  takeProfit: string;
  riskReward: string;
  summary: string;
};

type Candle = { open: number; high: number; low: number; close: number; time: string };

type LiveData = {
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  candles: Candle[];
};

type TFBias = { tf: string; bias: Bias };

// ---------------------------------------------------------------------------
// Binance data fetching
// ---------------------------------------------------------------------------

async function fetchLiveData(pair: string, interval: string): Promise<LiveData> {
  const symbol = pair.replace("/", "").toUpperCase();

  const tickerRes = await fetch(
    `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`
  );
  if (!tickerRes.ok) throw new Error(`Pair "${pair}" not found on Binance`);
  const ticker = await tickerRes.json();

  const candleRes = await fetch(
    `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=50`
  );
  const rawCandles = await candleRes.json();

  const candles: Candle[] = rawCandles.slice(-20).map((c: any[]) => ({
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

// Lightweight candle-only fetch, used for the other timeframes in the
// confluence row so we don't hit the ticker endpoint four extra times.
async function fetchCandlesOnly(pair: string, interval: string): Promise<Candle[]> {
  const symbol = pair.replace("/", "").toUpperCase();
  const candleRes = await fetch(
    `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=50`
  );
  const rawCandles = await candleRes.json();
  return rawCandles.slice(-20).map((c: any[]) => ({
    open: parseFloat(c[1]),
    high: parseFloat(c[2]),
    low: parseFloat(c[3]),
    close: parseFloat(c[4]),
    time: new Date(c[0]).toISOString(),
  }));
}

// Fast local heuristic (no AI call) used purely for the multi-timeframe
// confluence row — SMA10/SMA20 relationship plus where price sits relative
// to SMA10. This is deliberately simple; the AI call still does the real
// analysis for the main timeframe.
function quickBias(candles: Candle[]): Bias {
  if (candles.length < 20) return "NEUTRAL";
  const closes = candles.map((c) => c.close);
  const sma10 = closes.slice(-10).reduce((a, b) => a + b, 0) / 10;
  const sma20 = closes.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const lastClose = closes[closes.length - 1];

  if (sma10 > sma20 && lastClose > sma10) return "BULLISH";
  if (sma10 < sma20 && lastClose < sma10) return "BEARISH";
  return "NEUTRAL";
}

function formatPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(4);
  return price.toFixed(6);
}

function biasColor(bias: Bias): string {
  if (bias === "BULLISH") return "#22c55e";
  if (bias === "BEARISH") return "#ef4444";
  return "#f59e0b";
}

export default function CryptoAnalyzer() {
  const [pair, setPair] = useState("BTC/USDT");
  const [timeframe, setTimeframe] = useState("4h");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [liveData, setLiveData] = useState<LiveData | null>(null);
  const [mtfBias, setMtfBias] = useState<TFBias[] | null>(null);
  const [error, setError] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [autoRefreshSeconds, setAutoRefreshSeconds] = useState(60);
  const [showAutoRefreshMenu, setShowAutoRefreshMenu] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const handleAnalyzeRef = useRef<() => void>(() => {});

  const filteredPairs = pair
    ? POPULAR_PAIRS.filter((p) => p.toLowerCase().includes(pair.toLowerCase()))
    : POPULAR_PAIRS;

  async function handleAnalyze() {
    if (!pair.trim()) { setError("Please enter a trading pair."); return; }

    setLoading(true);
    setFetching(true);
    setError("");
    setAnalysis(null);
    setLiveData(null);
    setMtfBias(null);

    try {
      // Step 1: Fetch live market data for the selected timeframe
      const data = await fetchLiveData(pair, BINANCE_INTERVALS[timeframe]);
      setLiveData(data);

      // Step 2: Multi-timeframe confluence — fetch the other three
      // timeframes' candles in parallel and score each with the quick
      // local heuristic (no extra AI calls needed for this row).
      const otherTfs = TIMEFRAMES.filter((tf) => tf !== timeframe);
      const otherCandles = await Promise.all(
        otherTfs.map((tf) => fetchCandlesOnly(pair, BINANCE_INTERVALS[tf]))
      );

      const biasMap: Record<string, Bias> = {
        [timeframe]: quickBias(data.candles),
      };
      otherTfs.forEach((tf, i) => {
        biasMap[tf] = quickBias(otherCandles[i]);
      });
      setMtfBias(TIMEFRAMES.map((tf) => ({ tf, bias: biasMap[tf] })));

      setFetching(false);

      // Step 3: Build detailed market context for Levi
      const candleSummary = data.candles.map((c, i) =>
        `Candle ${i + 1}: O=${formatPrice(c.open)} H=${formatPrice(c.high)} L=${formatPrice(c.low)} C=${formatPrice(c.close)}`
      ).join("\n");

      const closes = data.candles.map((c) => c.close);
      const sma10 = closes.slice(-10).reduce((a, b) => a + b, 0) / 10;
      const sma20 = closes.slice(-20).reduce((a, b) => a + b, 0) / 20;
      const recentHigh = Math.max(...data.candles.slice(-10).map((c) => c.high));
      const recentLow = Math.min(...data.candles.slice(-10).map((c) => c.low));

      const prompt = `You are a professional crypto trading analyst. I will give you REAL live market data. Analyze it and respond ONLY in this exact JSON format, no extra text outside the JSON:

{
  "trend": "BULLISH" or "BEARISH" or "NEUTRAL",
  "confidence": a number 0-100 representing how strong/clear the signal is,
  "indicators": ["short tag", "short tag", ...] — 3 to 5 short indicator tags that back your call (e.g. "SMA10 < SMA20", "RSI oversold", "Volume declining", "Broke support"),
  "entry": "specific price level",
  "stopLoss": "specific price level",
  "takeProfit": "specific price level",
  "riskReward": "e.g. 1:2.5",
  "summary": "detailed 2-3 paragraph analysis covering: current market structure, key support/resistance levels, momentum, and your trade recommendation with reasoning"
}

LIVE MARKET DATA for ${pair.toUpperCase()} (${timeframe} timeframe):
- Current Price: ${formatPrice(data.price)}
- 24h Change: ${data.change24h.toFixed(2)}%
- 24h High: ${formatPrice(data.high24h)}
- 24h Low: ${formatPrice(data.low24h)}
- 24h Volume: ${data.volume24h.toLocaleString()}
- SMA10: ${formatPrice(sma10)}
- SMA20: ${formatPrice(sma20)}
- Recent 10-candle High: ${formatPrice(recentHigh)}
- Recent 10-candle Low: ${formatPrice(recentLow)}
- SMA Trend: ${sma10 > sma20 ? "SMA10 above SMA20 (bullish signal)" : "SMA10 below SMA20 (bearish signal)"}

Last 20 candles (${timeframe}):
${candleSummary}

Based on this REAL data, provide precise entry, stop loss, and take profit levels. SL should be below recent support for longs or above recent resistance for shorts. TP should target the next key resistance/support level. Calculate risk/reward ratio accurately. Set "confidence" honestly — if signals conflict, use a lower number (e.g. 40-55); only use 80+ when multiple indicators clearly agree.`;

      // Step 4: Send to Levi backend
      const token = localStorage.getItem("levi_token");
      const res = await fetch("http://127.0.0.1:8000/chat/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: prompt }),
      });

      const responseData = await res.json();
      const text = responseData.response || "";

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Could not parse analysis");

      const parsed = JSON.parse(jsonMatch[0]);
      setAnalysis({
        trend: parsed.trend,
        confidence: typeof parsed.confidence === "number" ? parsed.confidence : 50,
        indicators: Array.isArray(parsed.indicators) ? parsed.indicators : [],
        entry: parsed.entry,
        stopLoss: parsed.stopLoss,
        takeProfit: parsed.takeProfit,
        riskReward: parsed.riskReward,
        summary: parsed.summary,
      });
      setLastUpdated(new Date());

    } catch (e: any) {
      setError(e.message || "Analysis failed. Check the pair name and try again.");
      setFetching(false);
    } finally {
      setLoading(false);
    }
  }

  // Keep a ref to the latest handleAnalyze so the auto-refresh interval
  // always calls the current version without needing to be torn down and
  // rebuilt on every keystroke.
  useEffect(() => {
    handleAnalyzeRef.current = handleAnalyze;
  });

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      handleAnalyzeRef.current();
    }, autoRefreshSeconds * 1000);
    return () => clearInterval(id);
  }, [autoRefresh, autoRefreshSeconds]);

  const trendColor = analysis ? biasColor(analysis.trend) : "#22c55e";

  const TrendIcon =
    analysis?.trend === "BULLISH" ? TrendingUp :
    analysis?.trend === "BEARISH" ? TrendingDown : Minus;

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "28px 24px" }}>
      <div style={{ width: "100%", maxWidth: 820, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              background: "rgba(34,197,94,0.12)",
              border: "1px solid rgba(34,197,94,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <TrendingUp size={18} color="#22c55e" />
            </div>
            <div>
              <h1 style={{ color: "white", fontSize: 20, fontWeight: 700, margin: 0 }}>
                Live Trading Analyzer
              </h1>
              <p style={{ color: "#4B5563", fontSize: 13, margin: 0 }}>
                Real-time market data · AI-powered analysis by Levi
              </p>
            </div>
          </div>

          {/* Auto-refresh toggle */}
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {autoRefresh && (
                <button
                  onClick={() => setShowAutoRefreshMenu(!showAutoRefreshMenu)}
                  onBlur={() => setTimeout(() => setShowAutoRefreshMenu(false), 150)}
                  style={{
                    padding: "6px 10px",
                    background: "rgba(34,197,94,0.08)",
                    border: "1px solid rgba(34,197,94,0.25)",
                    borderRadius: 8, color: "#22c55e",
                    fontSize: 11, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  every {AUTO_REFRESH_OPTIONS.find((o) => o.seconds === autoRefreshSeconds)?.label}
                </button>
              )}
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                title={autoRefresh ? "Auto-refresh on" : "Auto-refresh off"}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "7px 12px",
                  background: autoRefresh ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${autoRefresh ? "rgba(34,197,94,0.35)" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: 10,
                  color: autoRefresh ? "#22c55e" : "#6B7280",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}
              >
                <span style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: autoRefresh ? "#22c55e" : "#374151",
                  boxShadow: autoRefresh ? "0 0 6px #22c55e" : "none",
                }} />
                Auto-refresh
              </button>
            </div>
            <AnimatePresence>
              {showAutoRefreshMenu && autoRefresh && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{
                    position: "absolute", top: "100%", right: 0,
                    background: "#0D1117", border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 10, marginTop: 6, zIndex: 10, minWidth: 100,
                  }}
                >
                  {AUTO_REFRESH_OPTIONS.map((opt) => (
                    <button
                      key={opt.seconds}
                      onClick={() => { setAutoRefreshSeconds(opt.seconds); setShowAutoRefreshMenu(false); }}
                      style={{
                        width: "100%", padding: "8px 12px",
                        background: autoRefreshSeconds === opt.seconds ? "rgba(34,197,94,0.1)" : "transparent",
                        border: "none", borderBottom: "1px solid rgba(255,255,255,0.04)",
                        color: autoRefreshSeconds === opt.seconds ? "#22c55e" : "#9CA3AF",
                        fontSize: 12, textAlign: "left", cursor: "pointer",
                      }}
                    >
                      Every {opt.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Input Card */}
        <div style={{
          background: "#0D1117",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 20,
          padding: 24,
          marginBottom: 24,
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>

            {/* Pair */}
            <div style={{ position: "relative" }}>
              <label style={{ color: "#6B7280", fontSize: 11, fontWeight: 600, letterSpacing: 0.5, display: "block", marginBottom: 8 }}>
                TRADING PAIR
              </label>
              <input
                value={pair}
                onChange={(e) => { setPair(e.target.value); setShowSuggestions(true); }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                onFocus={() => setShowSuggestions(true)}
                placeholder="e.g. BTC/USDT"
                style={{
                  width: "100%",
                  background: "#080A10",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  padding: "12px 14px",
                  color: "white",
                  fontSize: 15,
                  fontWeight: 600,
                  outline: "none",
                  fontFamily: "Inter, sans-serif",
                }}
              />
              <AnimatePresence>
                {showSuggestions && filteredPairs.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{
                      position: "absolute",
                      top: "100%", left: 0, right: 0,
                      background: "#0D1117",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 12,
                      marginTop: 4,
                      zIndex: 10,
                      maxHeight: 200,
                      overflowY: "auto",
                    }}
                  >
                    {filteredPairs.map((p) => (
                      <button
                        key={p}
                        onClick={() => { setPair(p); setShowSuggestions(false); }}
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          background: "transparent",
                          border: "none",
                          borderBottom: "1px solid rgba(255,255,255,0.04)",
                          color: "#9CA3AF",
                          fontSize: 13,
                          textAlign: "left",
                          cursor: "pointer",
                        }}
                      >
                        {p}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Timeframe */}
            <div>
              <label style={{ color: "#6B7280", fontSize: 11, fontWeight: 600, letterSpacing: 0.5, display: "block", marginBottom: 8 }}>
                TIMEFRAME
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                {TIMEFRAMES.map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    style={{
                      flex: 1,
                      padding: "12px 8px",
                      background: timeframe === tf ? "rgba(34,197,94,0.12)" : "#080A10",
                      border: `1px solid ${timeframe === tf ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.06)"}`,
                      borderRadius: 10,
                      color: timeframe === tf ? "#22c55e" : "#6B7280",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {tf.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 14, padding: "10px 14px", background: "rgba(239,68,68,0.08)", borderRadius: 8 }}>
              ⚠ {error}
            </p>
          )}

          <button
            onClick={handleAnalyze}
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              background: loading ? "#0a0c12" : "linear-gradient(135deg, #16a34a, #22c55e)",
              border: "none",
              borderRadius: 12,
              color: loading ? "#4B5563" : "white",
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: loading ? "none" : "0 4px 20px rgba(34,197,94,0.2)",
              transition: "all 0.2s",
            }}
          >
            {loading ? (
              <>
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                {fetching ? `Fetching live ${pair} data...` : "Analyzing with AI..."}
              </>
            ) : (
              <>
                <Zap size={16} />
                Analyze Live Market
              </>
            )}
          </button>

          {lastUpdated && !loading && (
            <p style={{ color: "#374151", fontSize: 11, textAlign: "center", marginTop: 10, marginBottom: 0 }}>
              Last updated {lastUpdated.toLocaleTimeString()}
              {autoRefresh && ` · auto-refreshing every ${AUTO_REFRESH_OPTIONS.find((o) => o.seconds === autoRefreshSeconds)?.label}`}
            </p>
          )}
        </div>

        {/* Live Price Card */}
        <AnimatePresence>
          {liveData && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: "#0D1117",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 16,
                padding: "16px 20px",
                marginBottom: 16,
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 16,
              }}
            >
              {[
                { label: "LIVE PRICE", value: `$${formatPrice(liveData.price)}`, color: "white" },
                { label: "24H CHANGE", value: `${liveData.change24h >= 0 ? "+" : ""}${liveData.change24h.toFixed(2)}%`, color: liveData.change24h >= 0 ? "#22c55e" : "#ef4444" },
                { label: "24H HIGH", value: `$${formatPrice(liveData.high24h)}`, color: "#22c55e" },
                { label: "24H LOW", value: `$${formatPrice(liveData.low24h)}`, color: "#ef4444" },
              ].map((item) => (
                <div key={item.label} style={{ textAlign: "center" }}>
                  <p style={{ color: "#4B5563", fontSize: 10, fontWeight: 600, letterSpacing: 0.5, margin: "0 0 6px" }}>
                    {item.label}
                  </p>
                  <p style={{ color: item.color, fontSize: 15, fontWeight: 700, margin: 0 }}>
                    {item.value}
                  </p>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Multi-timeframe confluence row */}
        <AnimatePresence>
          {mtfBias && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: "#0D1117",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 16,
                padding: "14px 20px",
                marginBottom: 16,
              }}
            >
              <p style={{ color: "#4B5563", fontSize: 10, fontWeight: 600, letterSpacing: 0.5, margin: "0 0 10px" }}>
                TIMEFRAME CONFLUENCE
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                {mtfBias.map((item) => {
                  const color = biasColor(item.bias);
                  const isActive = item.tf === timeframe;
                  return (
                    <div
                      key={item.tf}
                      style={{
                        background: `${color}0F`,
                        border: `1px solid ${color}${isActive ? "50" : "25"}`,
                        borderRadius: 10,
                        padding: "10px 6px",
                        textAlign: "center",
                      }}
                    >
                      <p style={{ color: "#6B7280", fontSize: 10, fontWeight: 700, margin: "0 0 4px" }}>
                        {item.tf.toUpperCase()}{isActive ? " •" : ""}
                      </p>
                      <p style={{ color, fontSize: 12, fontWeight: 700, margin: 0 }}>
                        {item.bias}
                      </p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Analysis Output */}
        <AnimatePresence>
          {analysis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Trend Banner */}
              <div style={{
                background: `${trendColor}10`,
                border: `1px solid ${trendColor}30`,
                borderRadius: 16,
                padding: "16px 20px",
                marginBottom: 14,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <TrendIcon size={28} color={trendColor} />
                    <div>
                      <p style={{ color: trendColor, fontSize: 22, fontWeight: 800, margin: 0 }}>
                        {analysis.trend}
                      </p>
                      <p style={{ color: "#6B7280", fontSize: 12, margin: 0 }}>
                        {pair.toUpperCase()} · {timeframe.toUpperCase()} · Live Analysis
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleAnalyze}
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 10,
                      padding: "8px 14px",
                      color: "#6B7280",
                      fontSize: 12,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <RefreshCw size={12} />
                    Refresh
                  </button>
                </div>

                {/* Confidence meter */}
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#6B7280", fontSize: 11, fontWeight: 600, letterSpacing: 0.5 }}>
                      <Gauge size={12} /> CONFIDENCE
                    </span>
                    <span style={{ color: trendColor, fontSize: 12, fontWeight: 700 }}>
                      {analysis.confidence}%
                    </span>
                  </div>
                  <div style={{ width: "100%", height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(0, Math.min(100, analysis.confidence))}%` }}
                      transition={{ duration: 0.5 }}
                      style={{ height: "100%", background: trendColor, borderRadius: 4 }}
                    />
                  </div>
                </div>

                {/* Indicator tags */}
                {analysis.indicators.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
                    {analysis.indicators.map((tag, i) => (
                      <span
                        key={i}
                        style={{
                          padding: "5px 10px",
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 999,
                          color: "#9CA3AF",
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Key Levels */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr 1fr",
                gap: 10,
                marginBottom: 14,
              }}>
                {[
                  { label: "ENTRY", value: analysis.entry, color: "#3b82f6", bg: "rgba(59,130,246,0.08)" },
                  { label: "STOP LOSS", value: analysis.stopLoss, color: "#ef4444", bg: "rgba(239,68,68,0.08)" },
                  { label: "TAKE PROFIT", value: analysis.takeProfit, color: "#22c55e", bg: "rgba(34,197,94,0.08)" },
                  { label: "RISK/REWARD", value: analysis.riskReward, color: "#D4AF37", bg: "rgba(212,175,55,0.08)" },
                ].map((item) => (
                  <div key={item.label} style={{
                    background: item.bg,
                    border: `1px solid ${item.color}25`,
                    borderRadius: 14,
                    padding: "14px 12px",
                    textAlign: "center",
                  }}>
                    <p style={{ color: "#4B5563", fontSize: 10, fontWeight: 600, letterSpacing: 0.5, margin: "0 0 8px" }}>
                      {item.label}
                    </p>
                    <p style={{ color: item.color, fontSize: 15, fontWeight: 700, margin: 0 }}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Analysis Summary */}
              <div style={{
                background: "#0D1117",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 16,
                padding: "20px 24px",
                marginBottom: 12,
              }}>
                <p style={{ color: "#4B5563", fontSize: 11, fontWeight: 600, letterSpacing: 0.5, marginBottom: 14 }}>
                  AI ANALYSIS
                </p>
                <div className="markdown-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {analysis.summary}
                  </ReactMarkdown>
                </div>
              </div>

              <p style={{ color: "#374151", fontSize: 11, textAlign: "center" }}>
                ⚠ AI analysis using live Binance data. Not financial advice. Always manage your risk.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </div>
  );
}
