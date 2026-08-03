/**
 * Utility to generate SVG trading chart data URLs for screenshots, demo data, and previews.
 */
export function generateTradingChartSVG(params: {
  symbol: string;
  direction: 'BUY' | 'SELL';
  outcome: 'WIN' | 'LOSS' | 'BREAKEVEN' | 'OPEN';
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;
}): string {
  const { symbol, direction, outcome, entryPrice, stopLossPrice, takeProfitPrice } = params;
  
  const isBuy = direction === 'BUY';
  const isWin = outcome === 'WIN';
  
  // Build a series of realistic candle data
  const candlesCount = 18;
  const candles: { open: number; high: number; low: number; close: number }[] = [];
  
  let currentPrice = entryPrice * (isBuy ? 0.992 : 1.008);
  const priceStep = (entryPrice * 0.003);

  for (let i = 0; i < candlesCount; i++) {
    const isEntryCandle = i === 6;
    let delta = (Math.sin(i * 0.8) + (Math.random() - 0.45)) * priceStep;
    
    // Force direction towards outcome after entry
    if (i > 6) {
      if (isWin) {
        delta = isBuy ? Math.abs(delta) + priceStep * 0.6 : -Math.abs(delta) - priceStep * 0.6;
      } else if (outcome === 'LOSS') {
        delta = isBuy ? -Math.abs(delta) - priceStep * 0.6 : Math.abs(delta) + priceStep * 0.6;
      }
    }

    const open = isEntryCandle ? entryPrice : currentPrice;
    let close = open + delta;
    if (i === candlesCount - 1 && isWin) {
      close = takeProfitPrice;
    } else if (i === candlesCount - 1 && outcome === 'LOSS') {
      close = stopLossPrice;
    }

    const high = Math.max(open, close) + Math.abs(delta) * (0.3 + Math.random() * 0.5);
    const low = Math.min(open, close) - Math.abs(delta) * (0.3 + Math.random() * 0.5);

    candles.push({ open, high, low, close });
    currentPrice = close;
  }

  // Min and max bounds
  const allPrices = [
    ...candles.map(c => c.high),
    ...candles.map(c => c.low),
    entryPrice,
    stopLossPrice,
    takeProfitPrice
  ];
  const minP = Math.min(...allPrices) * 0.997;
  const maxP = Math.max(...allPrices) * 1.003;
  const pRange = maxP - minP || 1;

  const width = 800;
  const height = 450;
  const padding = { top: 40, bottom: 40, left: 60, right: 80 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const getY = (price: number) => {
    return padding.top + chartHeight - ((price - minP) / pRange) * chartHeight;
  };

  const candleWidth = (chartWidth / candlesCount) * 0.6;
  const candleGap = chartWidth / candlesCount;

  // Build candle SVG paths
  const candleElements = candles.map((c, i) => {
    const x = padding.left + i * candleGap + candleGap / 2;
    const yOpen = getY(c.open);
    const yClose = getY(c.close);
    const yHigh = getY(c.high);
    const yLow = getY(c.low);

    const isBull = c.close >= c.open;
    const color = isBull ? '#10B981' : '#EF4444';
    const bodyY = Math.min(yOpen, yClose);
    const bodyHeight = Math.max(Math.abs(yOpen - yClose), 2);

    return `
      <line x1="${x}" y1="${yHigh}" x2="${x}" y2="${yLow}" stroke="${color}" stroke-width="1.5" opacity="0.85" />
      <rect x="${x - candleWidth / 2}" y="${bodyY}" width="${candleWidth}" height="${bodyHeight}" fill="${color}" rx="1" />
    `;
  }).join('');

  // Key Price Levels
  const entryY = getY(entryPrice);
  const slY = getY(stopLossPrice);
  const tpY = getY(takeProfitPrice);

  const formatPrice = (p: number) => (p >= 1000 ? p.toFixed(2) : p > 10 ? p.toFixed(3) : p.toFixed(5));

  const svgString = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" style="background-color: #0F1216; font-family: system-ui, sans-serif;">
  <defs>
    <linearGradient id="gridGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1E232A" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#0F1216" stop-opacity="0.9"/>
    </linearGradient>
  </defs>

  <!-- Background Grid -->
  <rect x="0" y="0" width="${width}" height="${height}" fill="#0F1216"/>
  
  <!-- Grid Lines -->
  ${[0.2, 0.4, 0.6, 0.8].map(ratio => `
    <line x1="${padding.left}" y1="${padding.top + chartHeight * ratio}" x2="${width - padding.right}" y2="${padding.top + chartHeight * ratio}" stroke="#1E232A" stroke-dasharray="4 4"/>
  `).join('')}

  <!-- Chart Header -->
  <text x="${padding.left}" y="28" fill="#F5F5F5" font-size="16" font-weight="bold">${symbol} · 15M</text>
  <text x="${padding.left + 140}" y="28" fill="${isBuy ? '#3B82F6' : '#EC4899'}" font-size="12" font-weight="600" letter-spacing="0.5">${direction}</text>
  <text x="${width - padding.right}" y="28" fill="#A0A6AE" font-size="12" text-anchor="end">Trading Journal View</text>

  <!-- Candlesticks -->
  <g>${candleElements}</g>

  <!-- Take Profit Line -->
  <line x1="${padding.left}" y1="${tpY}" x2="${width - padding.right}" y2="${tpY}" stroke="#10B981" stroke-width="1.5" stroke-dasharray="5 3"/>
  <rect x="${width - padding.right}" y="${tpY - 10}" width="72" height="20" fill="#10B981" rx="3"/>
  <text x="${width - padding.right + 36}" y="${tpY + 4}" fill="#000000" font-size="10" font-weight="bold" text-anchor="middle">TP ${formatPrice(takeProfitPrice)}</text>

  <!-- Entry Line -->
  <line x1="${padding.left}" y1="${entryY}" x2="${width - padding.right}" y2="${entryY}" stroke="#3B82F6" stroke-width="1.5"/>
  <rect x="${width - padding.right}" y="${entryY - 10}" width="72" height="20" fill="#3B82F6" rx="3"/>
  <text x="${width - padding.right + 36}" y="${entryY + 4}" fill="#FFFFFF" font-size="10" font-weight="bold" text-anchor="middle">EP ${formatPrice(entryPrice)}</text>

  <!-- Stop Loss Line -->
  <line x1="${padding.left}" y1="${slY}" x2="${width - padding.right}" y2="${slY}" stroke="#EF4444" stroke-width="1.5" stroke-dasharray="5 3"/>
  <rect x="${width - padding.right}" y="${slY - 10}" width="72" height="20" fill="#EF4444" rx="3"/>
  <text x="${width - padding.right + 36}" y="${slY + 4}" fill="#FFFFFF" font-size="10" font-weight="bold" text-anchor="middle">SL ${formatPrice(stopLossPrice)}</text>

  <!-- Watermark logo -->
  <text x="${width / 2}" y="${height / 2 + 10}" fill="#292D33" font-size="32" font-weight="bold" text-anchor="middle" opacity="0.4">TRADING JOURNAL</text>
</svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
}
