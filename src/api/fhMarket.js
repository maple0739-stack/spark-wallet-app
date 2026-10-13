const FH_ADDRESS = '0x48846a4083ec1b021d55d2b6200a8d9cd86e655e';
const FH_PLATFORM = 'bsc';
const KLINE_URL = 'https://dquery.sintral.io/u-kline/v1/k-line/candles';

export const FH_MARKET = {
    symbol: 'FH',
    address: FH_ADDRESS,
    platform: FH_PLATFORM,
};

const INTERVAL_MAP = {
    '1m': '1min',
    '5m': '5min',
    '15m': '15min',
    '1h': '1h',
    '1d': '1d',
};

function parseCandle(row) {
    if (!row || row.length < 6) return null;
    const candle = {
        timestamp: Number(row[5]),
        open: parseFloat(row[0]),
        high: parseFloat(row[1]),
        low: parseFloat(row[2]),
        close: parseFloat(row[3]),
        volume: parseFloat(row[4]),
    };
    if (!isFinite(candle.timestamp) || !isFinite(candle.close)) return null;
    return candle;
}

export function fetchDexKlines(address, platform, interval, limit) {
    if (!address) return Promise.resolve([]);
    const iv = INTERVAL_MAP[interval] || interval || '5min';
    const url = KLINE_URL
        + '?address=' + String(address).toLowerCase()
        + '&platform=' + (platform || FH_PLATFORM)
        + '&interval=' + iv
        + '&limit=' + (limit || 300);
    return fetch(url)
        .then((res) => res.json())
        .then((body) => {
            const rows = body && Array.isArray(body.data) ? body.data : [];
            return rows.map(parseCandle).filter(Boolean).sort((a, b) => a.timestamp - b.timestamp);
        })
        .catch(() => []);
}

function summarize(candles, address, platform) {
    if (!candles || !candles.length) return null;
    const last = candles[candles.length - 1];
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    let base = null;
    let high = null;
    let low = null;
    let amount = 0;
    candles.forEach((candle) => {
        if (candle.timestamp <= dayAgo) base = candle.close;
        if (candle.timestamp < dayAgo) return;
        if (high == null || candle.high > high) high = candle.high;
        if (low == null || candle.low < low) low = candle.low;
        if (isFinite(candle.volume) && isFinite(candle.close)) amount += candle.volume * candle.close;
    });
    if (base == null) base = candles[0].open;
    const change24h = base ? ((last.close - base) / base) * 100 : null;
    return {
        symbol: 'FH',
        address: address,
        platform: platform,
        price: last.close,
        change24h: change24h,
        high: high,
        low: low,
        amount: amount,
    };
}

export function fetchDexTicker(address, platform) {
    const chain = platform || FH_PLATFORM;
    return fetchDexKlines(address, chain, '1h', 48).then((candles) => summarize(candles, address, chain));
}

export function fetchFhTicker() {
    return fetchDexTicker(FH_ADDRESS, FH_PLATFORM);
}
