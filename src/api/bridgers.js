import axios from 'axios';
import { Platform } from 'react-native';

const BASE = 'https://api.bridgers.xyz';
const SOURCE_FLAG = 'sparkwallet';
const NATIVE = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

export const CHAIN_MAP_TO_BRIDGERS = { ETH: 'ETH', BNB: 'BSC', TRX: 'TRON' };
export const CHAIN_MAP_TO_TOKEN_API = { ETH: 'ETH', BNB: 'BSC', TRX: 'TRX' };
export const CHAIN_NAME_CN = {
  ETH: 'ETH',
  BNB: 'BSC',
  BSC: 'BSC',
  TRX: 'TRON',
  TRON: 'TRON',
  POLYGON: 'Polygon',
  ARBITRUM: 'Arbitrum',
  OPTIMISM: 'Optimism',
  AVALANCHE: 'Avalanche',
  BASE: 'Base',
  SOLANA: 'Solana',
  HECO: 'HECO',
};
export const RECEIVE_CHAIN_TABS = ['ETH', 'BSC', 'TRON', 'POLYGON', 'ARBITRUM', 'BASE', 'SOLANA'];

export function isTronChain(chain) {
  const c = String(chain || '').toUpperCase();
  return c === 'TRON' || c === 'TRX';
}
export const BRIDGERS_CONTRACT = {
  ETH: '0xc1d13492285eb664951E201BF7C80c7c6318a1b5',
  BSC: '0xc1d13492285eb664951E201BF7C80c7c6318a1b5',
  TRON: 'TJ4KeiGTvTX4wRUgLARiwr8rGLaurmVkdZ',
};

export const STATUS_KEYS = [
  'wait_deposit_send',
  'wait_deposit_send_fail',
  'wait_exchange_push',
  'wait_exchange_return',
  'wait_exchange_return_success',
  'wait_receive_send',
  'wait_enough_send',
  'wait_receive_confirm',
  'receive_complete',
  'wait_refund_send',
  'wait_refund_confirm',
  'refund_complete',
  'timeout',
  'ERROR',
  'error',
  'wait_for_information',
];

export function formatStatus(status) {
  if (!status) return '--';
  const key = String(status);
  if (STATUS_KEYS.indexOf(key) >= 0) return lan.t('bridgers.st_' + key);
  if (key.toUpperCase() === 'ERROR') return lan.t('bridgers.st_ERROR');
  const lower = key.toLowerCase();
  if (STATUS_KEYS.indexOf(lower) >= 0) return lan.t('bridgers.st_' + lower);
  return key;
}

function sourceType() {
  return Platform.OS === 'ios' ? 'IOS' : 'Android';
}

export function getEquipmentNo(addr) {
  if (!addr) return '00000000000000000000000000000001';
  const s = String(addr).replace(/^0x/i, '');
  return (s + '00000000000000000000000000000000').slice(0, 32);
}

export function isNativeToken(address) {
  if (!address) return true;
  return String(address).toLowerCase() === NATIVE;
}

export function toRawAmount(amount, decimals) {
  const s = String(amount || '0').trim();
  if (!s || s === '.') return '0';
  const parts = s.split('.');
  let intPart = parts[0].replace(/^0+(?=\d)/, '') || '0';
  let frac = parts[1] || '';
  if (frac.length > decimals) frac = frac.slice(0, decimals);
  while (frac.length < decimals) frac += '0';
  const raw = (intPart + frac).replace(/^0+/, '') || '0';
  return raw;
}

export function fromRawAmount(raw, decimals) {
  try {
    const s = String(raw || '0').replace(/^0x/i, '');
    const n = s.length > 15 ? s : String(parseInt(s, 10) || 0);
    if (decimals <= 0) return n;
    const pad = n.padStart(decimals + 1, '0');
    const i = pad.slice(0, -decimals);
    let f = pad.slice(-decimals).replace(/0+$/, '');
    return f ? i + '.' + f : i;
  } catch (e) {
    return '0';
  }
}

async function post(path, body) {
  const res = await axios.post(BASE + path, body, { timeout: 30000 });
  return res.data;
}

export async function getTokenList(chain) {
  const body = chain ? { chain } : {};
  const data = await post('/api/exchangeRecord/getToken', body);
  if (String(data.resCode) !== '100') throw new Error(data.resMsg || 'getToken fail');
  return (data.data && data.data.tokens) || [];
}

export async function quote(params) {
  const body = {
    ...params,
    equipmentNo: params.equipmentNo || getEquipmentNo(params.userAddr),
    sourceFlag: SOURCE_FLAG,
    sourceType: sourceType(),
  };
  const data = await post('/api/sswap/quote', body);
  if (String(data.resCode) !== '100') throw new Error(data.resMsg || 'quote fail');
  return data.data && data.data.txData;
}

export async function swap(params) {
  const body = {
    ...params,
    equipmentNo: params.equipmentNo || getEquipmentNo(params.fromAddress),
    sourceFlag: SOURCE_FLAG,
    sourceType: sourceType(),
  };
  const data = await post('/api/sswap/swap', body);
  if (String(data.resCode) !== '100') throw new Error(data.resMsg || 'swap fail');
  return data.data && data.data.txData;
}

export async function updateOrder(params) {
  const body = {
    ...params,
    equipmentNo: params.equipmentNo || getEquipmentNo(params.fromAddress),
    sourceFlag: SOURCE_FLAG,
    sourceType: sourceType(),
  };
  const data = await post('/api/exchangeRecord/updateDataAndStatus', body);
  if (String(data.resCode) !== '100') throw new Error(data.resMsg || 'order fail');
  return data.data;
}

export async function getTransData(params) {
  const body = {
    pageNo: 1,
    pageSize: 10,
    ...params,
    equipmentNo: params.equipmentNo || getEquipmentNo(params.fromAddress),
    sourceFlag: SOURCE_FLAG,
    sourceType: sourceType(),
  };
  const data = await post('/api/exchangeRecord/getTransData', body);
  if (String(data.resCode) !== '100') throw new Error(data.resMsg || 'record fail');
  return data.data || { list: [], total: 0 };
}

export async function getTransDataById(orderId) {
  const data = await post('/api/exchangeRecord/getTransDataById', { orderId });
  if (String(data.resCode) !== '100') throw new Error(data.resMsg || 'detail fail');
  return data.data;
}

export const DONE_STATUS = {
  receive_complete: 1,
  refund_complete: 1,
  timeout: 1,
  wait_deposit_send_fail: 1,
};

