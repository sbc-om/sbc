export function CryptoTradingView({ symbol }: { symbol: string }) {
  const src = `https://s.tradingview.com/widgetembed/?symbol=BINANCE:${encodeURIComponent(symbol)}&interval=60&hidesidetoolbar=1&symboledit=1&saveimage=0&toolbarbg=f1f3f6&studies=%5B%5D&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&hideideas=1&allow_symbol_change=0`;

  return (
    <section className="sbc-card rounded-2xl p-2 sm:p-3">
      <div className="h-[560px] w-full overflow-hidden rounded-xl border border-(--surface-border)">
        <iframe
          title={`TradingView ${symbol}`}
          src={src}
          className="h-full w-full"
          scrolling="no"
        />
      </div>
    </section>
  );
}
