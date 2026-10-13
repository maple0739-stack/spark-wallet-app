const GOPLUS_BASE = 'https://api.gopluslabs.io';

function httpErrorUserMessage(status) {
  if (status === 429) return '请求过于频繁，请稍后再试';
  if (status >= 500) return '服务暂时不可用';
  return `请求失败(${status})`;
}

/**
 * @param {number} chainId
 * @param {string} walletAddress
 */
export async function fetchGoplusErc20TokenApprovals(chainId, walletAddress) {
  const addr = (walletAddress || '').trim();
  if (!addr.startsWith('0x')) {
    return { ok: false, error: '仅支持 EVM 地址（0x 开头）' };
  }
  const q = new URLSearchParams({ addresses: addr });
  const url = `${GOPLUS_BASE}/api/v2/token_approval_security/${encodeURIComponent(String(chainId))}?${q}`;
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) {
      return { ok: false, error: httpErrorUserMessage(res.status) };
    }
    const json = await res.json();
    if (json.code !== 1) {
      return { ok: false, error: json.message || `GoPlus code ${json.code ?? 'unknown'}` };
    }
    return { ok: true, list: Array.isArray(json.result) ? json.result : [] };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : '网络请求失败' };
  }
}
