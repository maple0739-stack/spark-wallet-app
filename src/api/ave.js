import { AVE_API_KEY } from '../config/privateApiKeys';
const AVE_PRICE_URL = 'https://prod.ave-api.com/v2/tokens/price';

export function fetchAveTokenPrice(address, chain = 'bsc') {
  if (!address) return Promise.resolve(null);
  const tokenId = String(address).toLowerCase() + '-' + chain;
  return fetch(AVE_PRICE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': AVE_API_KEY,
    },
    body: JSON.stringify({ token_ids: [tokenId], tvl_min: 0 }),
  })
    .then((r) => r.json())
    .then((res) => {
      if (!res || res.status !== 1 || !res.data) return null;
      const d = res.data[tokenId] || res.data[Object.keys(res.data)[0]];
      if (!d || d.current_price_usd == null) return null;
      return {
        price: parseFloat(d.current_price_usd),
        change24h: parseFloat(d.price_change_24h),
      };
    })
    .catch(() => null);
}
