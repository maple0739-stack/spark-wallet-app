import { NODEREAL_API_KEY, ETHERSCAN_API_KEY } from '../config/privateApiKeys';
let CHAIN_LIST = {
  "ETH": {
    chainName:'Etherem Mainnet',
    chainSymbol:'ETH',
    chainId:1,
    chainUrl:'https://eth-mainnet.nodereal.io/v1/' + NODEREAL_API_KEY,
    rpcUrls:[
      'https://eth-mainnet.nodereal.io/v1/' + NODEREAL_API_KEY,
    ],
    browserUrl:'https://cn.etherscan.com',
    chainApi:'https://api.etherscan.io/api?apiKey=' + ETHERSCAN_API_KEY,
    transactions:'https://cn.etherscan.com/address/'
  },
  "BNB": {
    chainName:'Binance Smart Chain',
    chainSymbol:'BNB',
    chainId:56,
    chainUrl:'https://bsc-mainnet.nodereal.io/v1/' + NODEREAL_API_KEY,
    rpcUrls:[
      'https://bsc-mainnet.nodereal.io/v1/' + NODEREAL_API_KEY,
      'https://bsc-dataseed1.bnbchain.org',
    ],
    browserUrl:'https://bscscan.com',
    chainApi:'https://bsc-mainnet.nodereal.io/v1/api?apiKey=' + ETHERSCAN_API_KEY,
    transactions:'https://bscscan.com/address/'
  },
  "TRX": {
    chainName:'Tron',
    chainSymbol:'TRX',
    chainId:1,
    chainUrl:'https://api.trongrid.io',
    browserUrl:'https://tronscan.org/#/address/',
    transactions:'https://tronscan.org/#/address/'
  },
}
let CHAIN_MAP = [
  CHAIN_LIST["ETH"],
  CHAIN_LIST["BNB"],
  CHAIN_LIST["TRX"],
]
export {
  CHAIN_LIST,
  CHAIN_MAP
}
