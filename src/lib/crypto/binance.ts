export type BinanceTicker24h = {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
};

export type BinanceExchangeInfo = {
  timezone: string;
  serverTime: number;
  symbols: Array<{
    symbol: string;
    status: string;
    baseAsset: string;
    baseAssetPrecision: number;
    quoteAsset: string;
    quotePrecision: number;
    quoteAssetPrecision: number;
    orderTypes: string[];
    icebergAllowed: boolean;
    ocoAllowed: boolean;
    quoteOrderQtyMarketAllowed: boolean;
    allowTrailingStop: boolean;
    cancelReplaceAllowed: boolean;
    isSpotTradingAllowed: boolean;
    isMarginTradingAllowed: boolean;
    filters: Array<Record<string, string>>;
    permissions: string[];
  }>;
};

export type TopCryptoPair = {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  lastPrice: number;
  priceChangePercent: number;
  quoteVolume: number;
  highPrice: number;
  lowPrice: number;
};

export type CryptoSymbolDetails = {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  status: string;
  lastPrice: number;
  priceChange: number;
  priceChangePercent: number;
  weightedAvgPrice: number;
  highPrice: number;
  lowPrice: number;
  volume: number;
  quoteVolume: number;
  bidPrice: number;
  askPrice: number;
  spread: number;
  openPrice: number;
  closeTime: number;
  count: number;
  weeklyHigh: number;
  weeklyLow: number;
};

const BINANCE_API_BASE = "https://api.binance.com";

const STABLECOIN_BASE_ASSETS = new Set([
  "USDT",
  "USDC",
  "FDUSD",
  "BUSD",
  "TUSD",
  "USDP",
  "DAI",
]);

function toNumber(value: string | number | null | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function fetchBinance<T>(path: string): Promise<T> {
  const response = await fetch(`${BINANCE_API_BASE}${path}`, {
    next: { revalidate: 30 },
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Binance request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function getTopCryptoPairs(limit = 20): Promise<TopCryptoPair[]> {
  const [tickers, exchangeInfo] = await Promise.all([
    fetchBinance<BinanceTicker24h[]>("/api/v3/ticker/24hr"),
    fetchBinance<BinanceExchangeInfo>("/api/v3/exchangeInfo"),
  ]);

  const symbolInfoMap = new Map(
    exchangeInfo.symbols.map((item) => [item.symbol, item]),
  );

  return tickers
    .map((ticker) => {
      const symbolInfo = symbolInfoMap.get(ticker.symbol);
      if (!symbolInfo) return null;
      if (symbolInfo.status !== "TRADING") return null;
      if (symbolInfo.quoteAsset !== "USDT") return null;
      if (STABLECOIN_BASE_ASSETS.has(symbolInfo.baseAsset)) return null;

      return {
        symbol: ticker.symbol,
        baseAsset: symbolInfo.baseAsset,
        quoteAsset: symbolInfo.quoteAsset,
        lastPrice: toNumber(ticker.lastPrice),
        priceChangePercent: toNumber(ticker.priceChangePercent),
        quoteVolume: toNumber(ticker.quoteVolume),
        highPrice: toNumber(ticker.highPrice),
        lowPrice: toNumber(ticker.lowPrice),
      } satisfies TopCryptoPair;
    })
    .filter((item): item is TopCryptoPair => item !== null)
    .sort((a, b) => b.quoteVolume - a.quoteVolume)
    .slice(0, limit);
}

export async function getCryptoSymbolDetails(inputSymbol: string): Promise<CryptoSymbolDetails | null> {
  const symbol = inputSymbol.trim().toUpperCase();
  if (!symbol) return null;

  const [exchangeInfo, tickers, bookTicker, weeklyKlines] = await Promise.all([
    fetchBinance<BinanceExchangeInfo>(`/api/v3/exchangeInfo?symbol=${encodeURIComponent(symbol)}`),
    fetchBinance<BinanceTicker24h>(`/api/v3/ticker/24hr?symbol=${encodeURIComponent(symbol)}`),
    fetchBinance<{ bidPrice: string; askPrice: string }>(
      `/api/v3/ticker/bookTicker?symbol=${encodeURIComponent(symbol)}`,
    ),
    fetchBinance<Array<[number, string, string, string, string, string]>>(
      `/api/v3/klines?symbol=${encodeURIComponent(symbol)}&interval=1d&limit=7`,
    ),
  ]);

  const symbolInfo = exchangeInfo.symbols?.[0];
  if (!symbolInfo || symbolInfo.status !== "TRADING") return null;

  let weeklyHigh = 0;
  let weeklyLow = Number.MAX_SAFE_INTEGER;
  for (const candle of weeklyKlines) {
    const high = toNumber(candle[2]);
    const low = toNumber(candle[3]);
    if (high > weeklyHigh) weeklyHigh = high;
    if (low < weeklyLow) weeklyLow = low;
  }

  const bidPrice = toNumber(bookTicker.bidPrice);
  const askPrice = toNumber(bookTicker.askPrice);

  return {
    symbol,
    baseAsset: symbolInfo.baseAsset,
    quoteAsset: symbolInfo.quoteAsset,
    status: symbolInfo.status,
    lastPrice: toNumber(tickers.lastPrice),
    priceChange: toNumber(tickers.priceChange),
    priceChangePercent: toNumber(tickers.priceChangePercent),
    weightedAvgPrice: toNumber(tickers.weightedAvgPrice),
    highPrice: toNumber(tickers.highPrice),
    lowPrice: toNumber(tickers.lowPrice),
    volume: toNumber(tickers.volume),
    quoteVolume: toNumber(tickers.quoteVolume),
    bidPrice,
    askPrice,
    spread: askPrice - bidPrice,
    openPrice: toNumber(tickers.openPrice),
    closeTime: tickers.closeTime,
    count: Number(tickers.count ?? 0),
    weeklyHigh,
    weeklyLow: weeklyLow === Number.MAX_SAFE_INTEGER ? 0 : weeklyLow,
  };
}