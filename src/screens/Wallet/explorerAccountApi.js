const ETH_CHAIN_ID = 1;
const BSC_CHAIN_ID = 56;
import { NODEREAL_API_KEY, TRONGRID_API_KEY } from '../../config/privateApiKeys';
const NODEREAL_BLOCK_WINDOW = {
  1: 999,
  56: 100000,
};
const NODEREAL_TIP_BUFFER_DEFAULT = 48;
const NODEREAL_RPC = {
  1: 'https://eth-mainnet.nodereal.io/v1',
  56: 'https://bsc-mainnet.nodereal.io/v1',
};
const NODEREAL_LOOKBACK = {
  1: 108000,
  56: 432000,
};
const TRONGRID_BASE = 'https://api.trongrid.io';

function normalizeChainId(chainId) {
  const n = typeof chainId === 'number' ? chainId : Number(chainId);
  return Number.isFinite(n) && n > 0 ? n : ETH_CHAIN_ID;
}

function buildQuery(params) {
  return Object.keys(params)
    .map(function (k) {
      return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
    })
    .join('&');
}

function fetchJson(url, headers) {
  return new Promise(function (resolve) {
    var settled = false;
    function done(v) {
      if (settled) return;
      settled = true;
      resolve(v);
    }
    try {
      var xhr = new XMLHttpRequest();
      xhr.timeout = 12000;
      xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) return;
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            done({ ok: true, json: JSON.parse(xhr.responseText || '{}') });
          } catch (e) {
            done({ ok: false, error: 'JSON 解析失败' });
          }
        } else {
          done({
            ok: false,
            error: xhr.status ? 'HTTP ' + xhr.status : 'Network request failed',
          });
        }
      };
      xhr.ontimeout = function () {
        done({ ok: false, error: 'timeout' });
      };
      xhr.onerror = function () {
        done({ ok: false, error: 'Network request failed' });
      };
      xhr.open('GET', url, true);
      var h = headers || {};
      Object.keys(h).forEach(function (k) {
        xhr.setRequestHeader(k, h[k]);
      });
      xhr.send();
    } catch (e) {
      done({ ok: false, error: e && e.message ? e.message : '网络请求失败' });
    }
  });
}

function msToSec(t) {
  var n = Number(t);
  if (!Number.isFinite(n) || n <= 0) return '0';
  if (n > 1e12) n = Math.floor(n / 1000);
  return String(Math.floor(n));
}

function isTronAddress(addr) {
  return /^T[1-9A-HJ-NP-Za-km-z]{25,34}$/.test(String(addr || ''));
}

function tronToVisible(addr) {
  if (!addr) return '';
  var s = String(addr);
  if (s.charAt(0) === 'T') return s;
  try {
    if (typeof TronWeb !== 'undefined' && TronWeb.address) {
      return TronWeb.address.fromHex(s);
    }
  } catch (e) {}
  return s;
}

function mapTronNative(tx) {
  var c = tx.raw_data && tx.raw_data.contract && tx.raw_data.contract[0];
  var type = (c && c.type) || '';
  var v = (c && c.parameter && c.parameter.value) || {};
  var from = tronToVisible(v.owner_address || '');
  var to = tronToVisible(v.to_address || v.contract_address || '');
  var amount = '0';
  var input = '0x';
  if (type === 'TransferContract') {
    amount = String(v.amount || 0);
  } else {
    amount = String(v.call_value || v.amount || 0);
    input = v.data ? '0x' + v.data : type || '0x';
    if (v.contract_address) to = tronToVisible(v.contract_address);
  }
  var ret = tx.ret && tx.ret[0];
  var ok = !ret || !ret.contractRet || ret.contractRet === 'SUCCESS';
  var fee = ret && ret.fee != null ? ret.fee : tx.fee || 0;
  return {
    blockNumber: String(tx.blockNumber || tx.block_number || ''),
    timeStamp: msToSec(tx.block_timestamp || (tx.raw_data && tx.raw_data.timestamp) || 0),
    hash: tx.txID || tx.txid || '',
    from: from,
    to: to,
    value: amount,
    input: input,
    txreceipt_status: ok ? '1' : '0',
    isError: ok ? '0' : '1',
    gasUsed: '1',
    gasPrice: String(fee),
    contractAddress: '',
    tokenDecimal: '6',
  };
}

function mapTronTrc20(t, fallbackSymbol, fallbackDecimals) {
  var info = t.token_info || {};
  return {
    blockNumber: String(t.block || t.block_number || ''),
    timeStamp: msToSec(t.block_timestamp),
    hash: t.transaction_id || t.txID || '',
    from: t.from || '',
    to: t.to || '',
    value: String(t.value || '0'),
    input: '0x',
    txreceipt_status: '1',
    isError: '0',
    gasUsed: '1',
    gasPrice: '0',
    contractAddress: info.address || '',
    tokenSymbol: info.symbol || fallbackSymbol || '',
    tokenDecimal: String(info.decimals != null ? info.decimals : fallbackDecimals || 6),
  };
}

function fetchTronGrid(path) {
  console.log('[explorer] TronGrid GET', path);
  return fetchJson(TRONGRID_BASE + path, {
    'TRON-PRO-API-KEY': TRONGRID_API_KEY,
  }).then(function (r) {
    if (!r.ok) {
      console.log('[explorer] TronGrid fail', r.error);
      return r;
    }
    var json = r.json;
    if (!json || json.success === false) {
      var err = (json && (json.error || json.message)) || 'TronGrid 查询失败';
      console.log('[explorer] TronGrid fail', err);
      return { ok: false, error: err };
    }
    return { ok: true, json: json };
  });
}

function fetchTronNative(addr, limit) {
  var n = Math.min(Math.max(limit || 50, 1), 50);
  var path =
    '/v1/accounts/' +
    encodeURIComponent(addr) +
    '/transactions?' +
    buildQuery({
      only_confirmed: 'true',
      limit: String(n),
      order_by: 'block_timestamp,desc',
    });
  return fetchTronGrid(path).then(function (r) {
    if (!r.ok) return r;
    var list = (r.json.data || []).map(mapTronNative);
    console.log('[explorer] TronGrid native', list.length);
    return { ok: true, list: list };
  });
}

function fetchTronTrc20(addr, contract, limit, tokenMeta) {
  var n = Math.min(Math.max(limit || 50, 1), 50);
  var q = {
    only_confirmed: 'true',
    limit: String(n),
    order_by: 'block_timestamp,desc',
  };
  if (contract) q.contract_address = contract;
  var path =
    '/v1/accounts/' +
    encodeURIComponent(addr) +
    '/transactions/trc20?' +
    buildQuery(q);
  var symbol = (tokenMeta && tokenMeta.symbol) || '';
  var decimals = (tokenMeta && tokenMeta.decimals) || '6';
  return fetchTronGrid(path).then(function (r) {
    if (!r.ok) return r;
    var c = String(contract || '').toLowerCase();
    var list = (r.json.data || []).filter(function (t) {
      if (!c) return true;
      var a = ((t.token_info && t.token_info.address) || '').toLowerCase();
      return a === c;
    });
    console.log('[explorer] TronGrid trc20', list.length);
    return {
      ok: true,
      list: list.map(function (t) {
        return mapTronTrc20(t, symbol, decimals);
      }),
    };
  });
}

function toHexBlock(n) {
  if (!Number.isFinite(n) || n < 0) return '0x0';
  return '0x' + Math.floor(n).toString(16);
}

function hexWeiToDecimalString(hex) {
  const h = hex && hex.indexOf('0x') === 0 ? hex : '0x' + (hex || '0');
  try {
    if (typeof BigInt !== 'undefined') {
      return BigInt(h).toString();
    }
  } catch (e) {}
  return String(parseInt(h, 16) || 0);
}

function isNodeRealBlockTipError(msg) {
  return /blocknum|not reached/i.test(msg || '');
}

function nodeRealRpc(chainId, method, params) {
  const base = NODEREAL_RPC[normalizeChainId(chainId)];
  if (!base) return Promise.resolve({ ok: false, error: '不支持的链' });
  const url = base + '/' + encodeURIComponent(NODEREAL_API_KEY);
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: method, params: params }),
  })
    .then(function (res) {
      if (!res.ok) {
        return { ok: false, error: 'NodeReal HTTP ' + res.status };
      }
      return res.json().then(function (json) {
        if (json.error && json.error.message) {
          return { ok: false, error: json.error.message };
        }
        if (json.result === undefined) {
          return { ok: false, error: 'NodeReal 返回异常' };
        }
        return { ok: true, result: json.result };
      });
    })
    .catch(function (e) {
      return { ok: false, error: e && e.message ? e.message : 'NodeReal 网络错误' };
    });
}

function getLookback(chainId) {
  return NODEREAL_LOOKBACK[normalizeChainId(chainId)] || NODEREAL_LOOKBACK[56];
}

function getBlockWindow(chainId) {
  return NODEREAL_BLOCK_WINDOW[normalizeChainId(chainId)] || 999;
}

function isRangeError(msg) {
  return /range must be less than|invalid fromBlock and toBlock/i.test(msg || '');
}

function mapNodeExternalToNative(t) {
  const ts = t.blockTimeStamp != null ? t.blockTimeStamp : t.blockTimestamp || 0;
  return {
    blockNumber: String(parseInt(t.blockNum, 16)),
    timeStamp: String(ts),
    hash: t.hash,
    from: t.from,
    to: t.to || '',
    value: hexWeiToDecimalString(t.value),
    input: '0x',
    txreceipt_status:
      t.receiptsStatus != null ? String(t.receiptsStatus) : undefined,
    gasUsed: t.gasUsed != null ? String(t.gasUsed) : undefined,
    gasPrice: t.gasPrice != null ? String(t.gasPrice) : undefined,
  };
}

function normalizeIndexerTokenDecimals(raw, fallbackDecimals) {
  const t = String(raw || '').trim();
  if (!t) return fallbackDecimals;
  if (/^0x[0-9a-fA-F]+$/i.test(t)) return String(parseInt(t, 16));
  if (/^\d+$/.test(t)) return String(parseInt(t, 10));
  if (/^[0-9a-fA-F]+$/i.test(t) && /[a-f]/i.test(t)) {
    return String(parseInt(t, 16));
  }
  return t;
}

function mapNodeErc20ToExplorer(t, fallbackSymbol, fallbackDecimals) {
  const ts = t.blockTimeStamp != null ? t.blockTimeStamp : t.blockTimestamp || 0;
  const dec =
    t.decimal != null && t.decimal !== ''
      ? normalizeIndexerTokenDecimals(String(t.decimal), fallbackDecimals)
      : fallbackDecimals;
  return {
    blockNumber: String(parseInt(t.blockNum, 16)),
    timeStamp: String(ts),
    hash: t.hash,
    from: t.from,
    to: t.to || '',
    value: hexWeiToDecimalString(t.value),
    contractAddress: (t.contractAddress || '').toLowerCase(),
    tokenSymbol: (t.asset && t.asset.trim()) || fallbackSymbol,
    tokenDecimal: dec,
    txreceipt_status:
      t.receiptsStatus != null ? String(t.receiptsStatus) : undefined,
    gasUsed: t.gasUsed != null ? String(t.gasUsed) : undefined,
    gasPrice: t.gasPrice != null ? String(t.gasPrice) : undefined,
  };
}

function sortTxList(map, n) {
  return Object.keys(map)
    .map(function (k) {
      return map[k];
    })
    .sort(function (a, b) {
      return (
        Number(b.blockNumber) - Number(a.blockNumber) ||
        Number(b.timeStamp) - Number(a.timeStamp)
      );
    })
    .slice(0, n);
}

function queryNodeTransfers(id, addr, maxCount, category, extra, fromBlock, toBlock) {
  const base = Object.assign(
    {
      category: [category],
      order: 'desc',
      maxCount: maxCount,
      excludeZeroValue: false,
    },
    extra || {},
  );
  if (fromBlock != null && toBlock != null) {
    base.fromBlock = toHexBlock(fromBlock);
    base.toBlock = toHexBlock(toBlock);
  }
  return Promise.all([
    nodeRealRpc(id, 'nr_getAssetTransfers', [
      Object.assign({}, base, { fromAddress: addr }),
    ]),
    nodeRealRpc(id, 'nr_getAssetTransfers', [
      Object.assign({}, base, { toAddress: addr }),
    ]),
  ]).then(function (pair) {
    return { outgoing: pair[0], incoming: pair[1] };
  });
}

function scanNodeWindows(id, latest, queryFn, mergeFn, n) {
  const winSize = getBlockWindow(id);
  const lookback = getLookback(id);
  const safeTip = Math.max(0, latest - NODEREAL_TIP_BUFFER_DEFAULT);
  const oldest = Math.max(0, safeTip - lookback);
  const maxWindows = Math.ceil(lookback / winSize);
  const BATCH = 8;
  const map = {};
  let win = 0;
  console.log('[explorer] NodeReal scan', id, 'windows', maxWindows);

  function nextBatch() {
    if (Object.keys(map).length >= n || win >= maxWindows) {
      return Promise.resolve({ ok: true, list: sortTxList(map, n) });
    }
    const jobs = [];
    for (var i = 0; i < BATCH && win < maxWindows; i++) {
      const toBlock = Math.max(0, safeTip - win * winSize);
      const fromBlock = Math.max(oldest, toBlock - winSize);
      win += 1;
      if (toBlock <= oldest) break;
      jobs.push(queryFn(fromBlock, toBlock));
    }
    if (!jobs.length) {
      return Promise.resolve({ ok: true, list: sortTxList(map, n) });
    }
    return Promise.all(jobs).then(function (rows) {
      rows.forEach(function (r) {
        if (r.outgoing && r.outgoing.ok && r.incoming && r.incoming.ok) {
          mergeFn(r, map);
        }
      });
      return nextBatch();
    });
  }

  return nextBatch();
}

function fetchNativeViaNodeReal(chainId, walletAddress, want) {
  const id = normalizeChainId(chainId);
  const n = Math.min(Math.max(want, 1), 50);
  const maxCount = '0x' + n.toString(16);
  const addr = String(walletAddress || '').toLowerCase();
  console.log('[explorer] NodeReal native', id, addr, 'want', n);

  function merge(r, byHash) {
    (r.outgoing.result.transfers || []).forEach(function (t) {
      if (!t || !t.hash) return;
      if (t.category && t.category !== 'external') return;
      byHash[t.hash] = mapNodeExternalToNative(t);
    });
    (r.incoming.result.transfers || []).forEach(function (t) {
      if (!t || !t.hash) return;
      if (t.category && t.category !== 'external') return;
      if (!byHash[t.hash]) byHash[t.hash] = mapNodeExternalToNative(t);
    });
  }

  function query(fromBlock, toBlock) {
    return queryNodeTransfers(id, addr, maxCount, 'external', null, fromBlock, toBlock);
  }

  return query(null, null).then(function (r) {
    if (r.outgoing.ok && r.incoming.ok) {
      const byHash = {};
      merge(r, byHash);
      const list = sortTxList(byHash, n);
      console.log('[explorer] NodeReal native list', list.length);
      return { ok: true, list: list };
    }
    const err = r.outgoing.error || r.incoming.error || '';
    if (!isRangeError(err) && !isNodeRealBlockTipError(err)) {
      return { ok: false, error: err || 'NodeReal 查询失败' };
    }
    return nodeRealRpc(id, 'eth_blockNumber', []).then(function (bn) {
      if (!bn.ok) return bn;
      const latest = parseInt(bn.result, 16);
      if (!Number.isFinite(latest)) {
        return { ok: false, error: '无法解析最新区块号' };
      }
      return scanNodeWindows(id, latest, query, merge, n).then(function (res) {
        console.log('[explorer] NodeReal native list', (res.list || []).length);
        return res;
      });
    });
  });
}

function fetchTokenViaNodeReal(
  chainId,
  walletAddress,
  contractAddress,
  want,
  tokenSymbol,
  tokenDecimals,
) {
  const id = normalizeChainId(chainId);
  const contract = String(contractAddress || '').toLowerCase();
  const n = Math.min(Math.max(want, 1), 50);
  const maxCount = '0x' + n.toString(16);
  const addr = String(walletAddress || '').toLowerCase();
  console.log('[explorer] NodeReal token', id, addr, contract);

  function keyFn(row) {
    return row.hash + '-' + row.from + '-' + row.to + '-' + row.value;
  }

  function merge(r, byKey) {
    (r.outgoing.result.transfers || []).forEach(function (t) {
      if (t.category && t.category !== '20') return;
      const row = mapNodeErc20ToExplorer(t, tokenSymbol, tokenDecimals);
      if (row.contractAddress === contract) byKey[keyFn(row)] = row;
    });
    (r.incoming.result.transfers || []).forEach(function (t) {
      if (t.category && t.category !== '20') return;
      const row = mapNodeErc20ToExplorer(t, tokenSymbol, tokenDecimals);
      if (row.contractAddress === contract && !byKey[keyFn(row)]) {
        byKey[keyFn(row)] = row;
      }
    });
  }

  function query(fromBlock, toBlock) {
    return queryNodeTransfers(
      id,
      addr,
      maxCount,
      '20',
      { contractAddresses: [contractAddress] },
      fromBlock,
      toBlock,
    );
  }

  return query(null, null).then(function (r) {
    if (r.outgoing.ok && r.incoming.ok) {
      const byKey = {};
      merge(r, byKey);
      const list = sortTxList(byKey, n);
      console.log('[explorer] NodeReal token list', list.length);
      return { ok: true, list: list };
    }
    const err = r.outgoing.error || r.incoming.error || '';
    if (!isRangeError(err) && !isNodeRealBlockTipError(err)) {
      return { ok: false, error: err || 'NodeReal 查询失败' };
    }
    return nodeRealRpc(id, 'eth_blockNumber', []).then(function (bn) {
      if (!bn.ok) return bn;
      const latest = parseInt(bn.result, 16);
      if (!Number.isFinite(latest)) {
        return { ok: false, error: '无法解析最新区块号' };
      }
      return scanNodeWindows(id, latest, query, merge, n).then(function (res) {
        console.log('[explorer] NodeReal token list', (res.list || []).length);
        return res;
      });
    });
  });
}

function fetchExplorerTxList(chainId, walletAddress, page, offset) {
  offset = offset == null ? 50 : offset;
  const id = normalizeChainId(chainId);
  const addr = walletAddress || '';
  console.log('[explorer] fetchExplorerTxList', id, addr);

  if (!addr) {
    return Promise.resolve({ ok: false, error: '钱包地址为空' });
  }
  if (isTronAddress(addr)) {
    return fetchTronNative(addr, offset);
  }
  if (id === ETH_CHAIN_ID || id === BSC_CHAIN_ID) {
    return fetchNativeViaNodeReal(id, addr, offset);
  }
  return Promise.resolve({ ok: false, error: '当前链不支持应用内交易列表' });
}

function fetchExplorerTokenTx(
  chainId,
  walletAddress,
  contractAddress,
  page,
  offset,
  tokenMeta,
) {
  offset = offset == null ? 50 : offset;
  const id = normalizeChainId(chainId);
  const addr = walletAddress || '';
  const meta = tokenMeta || { symbol: '', decimals: '18' };
  console.log('[explorer] fetchExplorerTokenTx', id, addr, contractAddress);

  if (!addr) {
    return Promise.resolve({ ok: false, error: '钱包地址为空' });
  }
  if (!contractAddress) {
    return Promise.resolve({ ok: false, error: '合约地址为空' });
  }
  if (isTronAddress(addr) || isTronAddress(contractAddress)) {
    return fetchTronTrc20(addr, contractAddress, offset, meta);
  }
  if (id === ETH_CHAIN_ID || id === BSC_CHAIN_ID) {
    return fetchTokenViaNodeReal(
      id,
      addr,
      contractAddress,
      offset,
      meta.symbol,
      meta.decimals,
    );
  }
  return Promise.resolve({ ok: false, error: '当前链不支持应用内代币转账记录' });
}

export { fetchExplorerTxList, fetchExplorerTokenTx };
