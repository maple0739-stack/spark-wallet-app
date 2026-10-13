import Web3 from 'web3';

export const PANCAKE_V2_ROUTER = '0x10ED43C718714eb63d5aA57B78B54704E256024E';
const WBNB = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';
const USDT = '0x55d398326f99059fF775485246999027B3197955';
const FH = '0x48846a4083eC1B021d55D2b6200a8D9cd86E655E';

export const SWAP_TOKENS = [
    { symbol: 'BNB', address: '' },
    { symbol: 'USDT', address: USDT },
    { symbol: 'FH', address: FH },
];

const FALLBACK_RPCS = [
    'https://bsc.publicnode.com',
    'https://bsc-dataseed1.bnbchain.org',
    'https://bsc-dataseed.binance.org',
];

const RouterAbi = [
    {
        constant: true,
        inputs: [
            { name: 'amountIn', type: 'uint256' },
            { name: 'path', type: 'address[]' },
        ],
        name: 'getAmountsOut',
        outputs: [{ name: 'amounts', type: 'uint256[]' }],
        payable: false,
        stateMutability: 'view',
        type: 'function',
    },
    {
        constant: false,
        inputs: [
            { name: 'amountOutMin', type: 'uint256' },
            { name: 'path', type: 'address[]' },
            { name: 'to', type: 'address' },
            { name: 'deadline', type: 'uint256' },
        ],
        name: 'swapExactETHForTokensSupportingFeeOnTransferTokens',
        outputs: [],
        payable: true,
        stateMutability: 'payable',
        type: 'function',
    },
    {
        constant: false,
        inputs: [
            { name: 'amountIn', type: 'uint256' },
            { name: 'amountOutMin', type: 'uint256' },
            { name: 'path', type: 'address[]' },
            { name: 'to', type: 'address' },
            { name: 'deadline', type: 'uint256' },
        ],
        name: 'swapExactTokensForETHSupportingFeeOnTransferTokens',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        constant: false,
        inputs: [
            { name: 'amountIn', type: 'uint256' },
            { name: 'amountOutMin', type: 'uint256' },
            { name: 'path', type: 'address[]' },
            { name: 'to', type: 'address' },
            { name: 'deadline', type: 'uint256' },
        ],
        name: 'swapExactTokensForTokensSupportingFeeOnTransferTokens',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
];

function rpcList() {
    const list = [];
    if (useChainInfo && useChainInfo.chainUrl) list.push(useChainInfo.chainUrl);
    if (useChainInfo && Array.isArray(useChainInfo.rpcUrls)) {
        useChainInfo.rpcUrls.forEach((url) => {
            if (url && list.indexOf(url) < 0) list.push(url);
        });
    }
    FALLBACK_RPCS.forEach((url) => {
        if (list.indexOf(url) < 0) list.push(url);
    });
    return list;
}

function router(rpcUrl) {
    const url = rpcUrl || (useChainInfo && useChainInfo.chainUrl) || FALLBACK_RPCS[0];
    const web3 = new Web3(new Web3.providers.HttpProvider(url));
    return web3.eth.contract(RouterAbi).at(PANCAKE_V2_ROUTER);
}

function bn(value) {
    return new Web3().toBigNumber(value);
}

function padUint(value) {
    let hex = '';
    try {
        hex = bn(value).toString(16);
    } catch (e) {
        hex = Number(value).toString(16);
    }
    if (hex.indexOf('-') >= 0) hex = '0';
    return hex.replace(/^0x/, '').padStart(64, '0');
}

function padAddress(address) {
    return String(address || '').toLowerCase().replace(/^0x/, '').padStart(64, '0');
}

function encodeGetAmountsOut(amountInWei, path) {
    let data = '0xd06ca61f';
    data += padUint(amountInWei);
    data += padUint(64);
    data += padUint(path.length);
    for (let i = 0; i < path.length; i++) data += padAddress(path[i]);
    return data;
}

function decodeUintArray(result) {
    if (!result || result === '0x' || result.length < 130) return null;
    const hex = result.replace(/^0x/, '');
    const offset = parseInt(hex.slice(0, 64), 16) * 2;
    const length = parseInt(hex.slice(offset, offset + 64), 16);
    if (!isFinite(length) || length <= 0) return null;
    const items = [];
    for (let i = 0; i < length; i++) {
        const start = offset + 64 + i * 64;
        const slice = hex.slice(start, start + 64);
        if (!slice) return null;
        items.push(bn('0x' + slice).toString(10));
    }
    return items;
}

function ethCall(rpcUrl, to, data) {
    return fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_call',
            params: [{ to: to, data: data }, 'latest'],
        }),
    })
        .then((res) => res.json())
        .then((body) => {
            if (!body || body.error || !body.result) return null;
            return body.result;
        })
        .catch(() => null);
}

export function swapPath(fromSymbol, toSymbol) {
    if (fromSymbol === 'FH' && toSymbol === 'USDT') return [FH, USDT];
    if (fromSymbol === 'USDT' && toSymbol === 'FH') return [USDT, FH];
    if (fromSymbol === 'BNB' && toSymbol === 'USDT') return [WBNB, USDT];
    if (fromSymbol === 'USDT' && toSymbol === 'BNB') return [USDT, WBNB];
    if (fromSymbol === 'BNB' && toSymbol === 'FH') return [WBNB, USDT, FH];
    if (fromSymbol === 'FH' && toSymbol === 'BNB') return [FH, USDT, WBNB];
    return null;
}

export function toWei(amount) {
    const web3 = new Web3();
    return web3.toWei(String(amount), 'ether');
}

export function fromWei(wei) {
    const web3 = new Web3();
    return web3.fromWei(web3.toBigNumber(wei), 'ether');
}

export function applySlippage(amountWei, slippagePercent) {
    const web3 = new Web3();
    const keep = 100 - Number(slippagePercent || 0);
    return web3.toBigNumber(amountWei).mul(keep).div(100).toString(10);
}

export function routeSymbols(fromSymbol, toSymbol) {
    const path = swapPath(fromSymbol, toSymbol) || [];
    return path.map((addr) => {
        const a = String(addr).toLowerCase();
        if (a === WBNB.toLowerCase()) return 'BNB';
        if (a === USDT.toLowerCase()) return 'USDT';
        if (a === FH.toLowerCase()) return 'FH';
        return '';
    }).filter(Boolean);
}

function quoteOutViaContract(rpcUrl, amountInWei, path) {
    return new Promise((resolve) => {
        try {
            router(rpcUrl).getAmountsOut(amountInWei, path, (err, result) => {
                if (err || !result || !result.length) {
                    resolve(null);
                    return;
                }
                const out = result[result.length - 1];
                resolve(out.toString(10));
            });
        } catch (e) {
            resolve(null);
        }
    });
}

function quoteOutViaEthCall(rpcUrl, amountInWei, path) {
    const data = encodeGetAmountsOut(amountInWei, path);
    return ethCall(rpcUrl, PANCAKE_V2_ROUTER, data).then((result) => {
        const amounts = decodeUintArray(result);
        if (!amounts || !amounts.length) return null;
        return amounts[amounts.length - 1];
    });
}

export function quoteOut(fromSymbol, toSymbol, amountInWei) {
    const path = swapPath(fromSymbol, toSymbol);
    if (!path || amountInWei == null) return Promise.resolve(null);
    const rpcs = rpcList();
    let index = 0;
    const next = () => {
        if (index >= rpcs.length) return Promise.resolve(null);
        const rpc = rpcs[index++];
        return quoteOutViaEthCall(rpc, amountInWei, path).then((out) => {
            if (out) return out;
            return quoteOutViaContract(rpc, amountInWei, path).then((out2) => {
                if (out2) return out2;
                return next();
            });
        });
    };
    return next();
}

export function quoteDetails(fromSymbol, toSymbol, amountInWei) {
    const path = swapPath(fromSymbol, toSymbol);
    if (!path) return Promise.resolve(null);
    const web3 = new Web3();
    const input = web3.toBigNumber(amountInWei);
    let probe = input.div(1000).floor();
    if (probe.lt('1000000000000')) probe = input;
    return quoteOut(fromSymbol, toSymbol, amountInWei).then((outWei) => {
        if (!outWei) return null;
        return quoteOut(fromSymbol, toSymbol, probe.toString(10)).then((probeOut) => {
            let impact = 0;
            if (probeOut && probe.gt(0)) {
                const actual = web3.toBigNumber(outWei);
                const spot = web3.toBigNumber(probeOut).mul(input).div(probe);
                if (spot.gt(actual) && spot.gt(0)) {
                    impact = spot.minus(actual).div(spot).toNumber() * 100;
                }
            }
            return {
                outWei: outWei,
                impact: impact,
                hops: path.length - 1,
                feeRate: 0.0025 * (path.length - 1),
            };
        });
    });
}

export function buildSwapData(fromSymbol, toSymbol, amountInWei, amountOutMinWei, toAddress) {
    const path = swapPath(fromSymbol, toSymbol);
    const deadline = Math.round(Date.now() / 1000) + 600;
    const contract = router();
    if (fromSymbol === 'BNB') {
        return contract.swapExactETHForTokensSupportingFeeOnTransferTokens.getData(
            amountOutMinWei, path, toAddress, deadline
        );
    }
    if (toSymbol === 'BNB') {
        return contract.swapExactTokensForETHSupportingFeeOnTransferTokens.getData(
            amountInWei, amountOutMinWei, path, toAddress, deadline
        );
    }
    return contract.swapExactTokensForTokensSupportingFeeOnTransferTokens.getData(
        amountInWei, amountOutMinWei, path, toAddress, deadline
    );
}

export function tokenBySymbol(symbol) {
    for (let i = 0; i < SWAP_TOKENS.length; i++) {
        if (SWAP_TOKENS[i].symbol === symbol) return SWAP_TOKENS[i];
    }
    return null;
}
