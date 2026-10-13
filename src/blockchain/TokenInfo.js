let ETH_TOKEN = [
  {
    address:'',
    name:'ETH',
    symbol:'ETH',
    decimals: 18,
    price: 'ETHUSDT'
  },{
    address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    name: 'Tether USD',
    symbol: 'USDT',
    decimals: 6,
    price: ''
  },{
    address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    price: ''
  }
]
let BNB_TOKEN = [
  {
    address:'',
    name:'BNB',
    symbol:'BNB',
    decimals: 18,
    price: 'BNBUSDT'
  },
  {
    address: '0x48846a4083eC1B021d55D2b6200a8D9cd86E655E',
    name: 'FH',
    symbol: 'FH',
    decimals: 18,
    price: '',
    router: '0x10ED43C718714eb63d5aA57B78B54704E256024E'
  },
  {
    address: '0x55d398326f99059ff775485246999027b3197955',
    name: 'Binance-Peg BSC-USD',
    symbol: 'USDT',
    decimals: 18,
    price: ''
  },
  {
    address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 18,
    price: ''
  }
]

let TRX_TOKEN = [
  {
    address:'',
    name:'TRX',
    symbol:'TRX',
    decimals: 6,
    price: 'TRXUSDT'
  },
  {
    address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    name: 'Tether USD',
    symbol: 'USDT',
    decimals: 6,
    price: ''
  },
  {
    address: 'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8',
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    price: ''
  }
]

let TOKEN_LIST = {
  "ETH": ETH_TOKEN,
  "BNB": BNB_TOKEN,
  "TRX": TRX_TOKEN,
}

export {
  TOKEN_LIST,
  BNB_TOKEN,
  ETH_TOKEN,
  TRX_TOKEN
}
