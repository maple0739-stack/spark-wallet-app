/**
 * Created by zenghao on 2018/11/29.
 * alt.zp-2kfizv0@yopmail.com
 */
import "react-native-get-random-values"
import "@ethersproject/shims"
import { ethers } from 'ethers';
import Tx from 'ethereumjs-tx';
import Web3 from 'web3';
const BigNumber = require('bignumber.js');
let Wallet = ethers.Wallet;
import TronWebLink from "tronweb/dist/TronWeb";
import { TRON_PRO_API_KEY, TRON_PRIVATE_KEY } from "../config/privateApiKeys";
let TronWebs = new TronWebLink({
    fullHost: 'https://api.trongrid.io',
    headers: { 'TRON-PRO-API-KEY': TRON_PRO_API_KEY },
    privateKey: TRON_PRIVATE_KEY
})
global.TronWeb = TronWebs;
//USDT合约
import { tokenAbi } from './contract/TokenContract';
import { TokenPriceAbi,TokenPriceAddress } from './contract/TokenPrice';
//跨链桥
import {
    BridgeAbi,
} from "./contract/CrossBridge";

function getRpcList() {
    const info = (typeof useChainInfo !== 'undefined' && useChainInfo) ? useChainInfo : {};
    let list = [];
    if (info.rpcUrls && info.rpcUrls.length) list = info.rpcUrls.slice();
    else if (info.chainUrl) list = [info.chainUrl];
    return list.slice(0, 2);
}

const RPC_TIMEOUT = 5000;

function rpcOnce(url, method, params, timeoutMs) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('rpc timeout')), timeoutMs || RPC_TIMEOUT);
        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }),
        }).then(r => r.json()).then(j => {
            clearTimeout(timer);
            if (j && j.error) reject(j.error);
            else resolve(j && j.result);
        }).catch(e => {
            clearTimeout(timer);
            reject(e);
        });
    });
}

function rpcWithFallback(method, params) {
    const list = getRpcList();
    if (!list.length) return Promise.reject(new Error('no rpc'));
    return rpcOnce(list[0], method, params, RPC_TIMEOUT).catch(() => {
        if (list.length < 2) return Promise.reject(new Error('rpc failed'));
        return rpcOnce(list[1], method, params, RPC_TIMEOUT);
    });
}

function formatTokenBalance(raw, decimals) {
    let bn;
    if (typeof raw === 'string' && (raw.indexOf('0x') === 0 || raw.indexOf('0X') === 0)) {
        bn = new BigNumber(raw.slice(2) || '0', 16);
    } else {
        bn = new BigNumber(raw.toString());
    }
    let balance = bn.dividedBy(new BigNumber(10).pow(decimals || 18));
    if (balance.isZero()) return "0.0000";
    let s = balance.toFixed(6);
    s = s.replace(/(\.\d*?[1-9])0+$/, '$1').replace(/\.0+$/, '');
    if (s.indexOf('.') === -1) s = s + '.0000';
    return s;
}

function balanceOfData(walletAddress) {
    return '0x70a08231' + walletAddress.replace(/^0x/i, '').toLowerCase().padStart(64, '0');
}

/**
 * 创建钱包
 * @returns {Promise<T | never>}
 */
export function createWallet() {
    return new Promise((resolve, reject)=>{
        let ethWallet = ethers.Wallet.createRandom();
        if(ethWallet){
            //生成波场钱包地址
            let tronAddress = TronWeb.address.fromHex(ethWallet.address);
            let ETHWallet = {
                mnemonic:ethWallet.mnemonic.phrase,
                privateKey:ethWallet.privateKey,
                address:ethWallet.address,
                tronAddress:tronAddress
            }
            resolve(ETHWallet)
        }else{
            resolve(null)
        }
    }).catch(e => {
        reject(e)
    })
}
/**
 * 私钥导入钱包
 * @param toAddress
 * @returns {Promise}
 */
export function ImportPrivateKey(PrivateKey) {
    return new Promise((resolve,reject)=>{
        let wallet = new Wallet(PrivateKey);
        resolve(wallet)

    }).catch(e => {
        Toast.info(lan.t('wallet.pkFailure'))
    })
}
/**
 * 助记词导入钱包
 * @param toAddress
 * @returns {Promise}
 */
export function ImportMemorizingWords(MemorizingWords) {

    return new Promise((resolve,reject)=>{
        let wallet = Wallet.fromMnemonic(MemorizingWords)
        resolve(wallet)
    }).catch(e => {
        Toast.info(lan.t('wallet.MeFailure'))
    })
}
/**
 * 查询钱包余额
 * @param toAddress
 * @returns {Promise}
 */
export function getBalance(address,item) {
    return new Promise((resolve)=>{
        if(!address){
            resolve(0);
            return;
        }
        const done = (raw, decimals) => {
            try {
                if (raw === undefined || raw === null || raw === '0x') {
                    resolve(0);
                    return;
                }
                resolve(formatTokenBalance(raw, decimals));
            } catch (e) {
                resolve(0);
            }
        };
        if(!item || !item.address) {
            rpcWithFallback('eth_getBalance', [address, 'latest'])
                .then((result) => done(result, 18))
                .catch(() => resolve(0));
        }else{
            rpcWithFallback('eth_call', [{ to: item.address, data: balanceOfData(address) }, 'latest'])
                .then((result) => done(result, item.decimals))
                .catch(() => resolve(0));
        }
    })
}

export function getBalances(address, tokenList) {
    return new Promise((resolve)=>{
        if(!address || !tokenList || !tokenList.length){
            resolve([]);
            return;
        }
        Promise.all(tokenList.map((item) =>
            getBalance(address, item).then((data) => ({ item, data }))
        )).then(resolve).catch(() => resolve(tokenList.map((item) => ({ item, data: 0 }))));
    });
}
export function getAllBalance(address,item) {
    const chainWeb3 =  new Web3(new Web3.providers.HttpProvider(useChainInfo.chainUrl))
    return new Promise((resolve,reject)=>{
        //查询ETH余额
        if(!item || !item.address) {
            chainWeb3.eth.getBalance(address, function (error, result) {
                if(result){
                    let balance = chainWeb3.fromWei(result.toString());
                    resolve(balance)
                }else{
                    resolve(0)
                }
            });
        }else{
            // 查询代币余额
            try {
                let tokenInstance = chainWeb3.eth.contract(tokenAbi);
                let tokenContract = tokenInstance.at(item.address);
                tokenContract.balanceOf(address,function (error, result) {
                    if (!error) {
                        let mathNum = Math.pow(10, item.decimals);
                        let balance = new BigNumber(result.toString()).dividedBy(mathNum).toNumber()
                        resolve(balance)
                    } else {
                        console.log(error);
                    }
                });
            }catch (e) {

            }
        }
    })
}

//查询代币价格
export function getTokenPrice(tokenAddress,routerAddress) {
    const chainWeb3 =  new Web3(new Web3.providers.HttpProvider(useChainInfo.chainUrl))
    let chainInstance = chainWeb3.eth.contract(TokenPriceAbi);
    let chainContract = chainInstance.at(TokenPriceAddress);
    return new Promise((resolve,reject)=>{
        chainContract.getTokenPrice(tokenAddress,routerAddress,function (err, result){
            if(result){
                let balance = result.toNumber() / Math.pow(10,18);
                resolve(balance)
            }else{
                resolve(null)
            }
        })
    })
}

/**
 * 转账签名广播交易
 * @param data
 * @param contractAddress
 * @param amount
 * @returns {Promise<any>}
 */
export function transferTransaction(data,toAddress,limit,gwei,amount) {

    const chainWeb3 =  new Web3(new Web3.providers.HttpProvider(useChainInfo.chainUrl))
    return new Promise((resolve,reject)=>{

        chainWeb3.eth.getTransactionCount(walletAddress,function (error,nonce) {
            var gasPrice = gwei * Math.pow(10,9)
            var value = amount * Math.pow(10,18);
            var transaction = {
                chainId:useChainInfo.chainId,
                nonce: nonce,
                gasPrice: chainWeb3.toHex(gasPrice),
                gasLimit: chainWeb3.toHex(limit),
                to: toAddress,
                value: value,
                data: data,
            };
            var pk = walletPrivateKey.substring(0,2);
            var private_key = "";
            if(pk == "0x"){
                private_key = walletPrivateKey.substring(2,100);
            }
            var tx = new Tx(transaction);
            var prk =new Buffer(private_key, 'hex');
            tx.sign(prk);
            var signedTransaction = tx.serialize();
            chainWeb3.eth.sendRawTransaction('0x' + signedTransaction.toString('hex'), function(err, hash) {
                console.log("上链hash=",hash)
                if (!err) {
                    resolve(hash)
                }else{
                    console.log(err)
                    resolve("")
                }
            })
        })
    })
}

/**
 * 签名广播交易
 * @param limit
 * @param gwei
 * @param amount
 * @returns {Promise<unknown>}
 */
export function sigTransactionBroadcast(contractAddress,data,limit,gwei,amount) {
    const chainWeb3 =  new Web3(new Web3.providers.HttpProvider(useChainInfo.chainUrl))
    return new Promise((resolve,reject)=>{
        chainWeb3.eth.getTransactionCount(walletAddress,function (error,nonce) {
            let gasPrice = gwei * Math.pow(10,9)
            let value = amount * Math.pow(10,18);
            let transaction = {
                chainId:useChainInfo.chainId,
                nonce: nonce,
                gasPrice: chainWeb3.toHex(gasPrice),
                gasLimit: chainWeb3.toHex(limit),
                to: contractAddress,
                value: value,
                data: data,
            };
            let pk = walletPrivateKey.substring(0,2);
            let private_key = "";
            if(pk == "0x"){
                private_key = walletPrivateKey.substring(2,100);
            }
            let tx = new Tx(transaction);
            let prk =new Buffer(private_key, 'hex');
            tx.sign(prk);
            let signedTransaction = tx.serialize();
            chainWeb3.eth.sendRawTransaction('0x' + signedTransaction.toString('hex'), function(err, hash) {
                console.log("上链hash=",hash)
                if (!err) {
                    resolve(hash)
                }else{
                    console.log(err)
                    resolve("")
                }
            })
        })
    })
}
//查询波场钱包余额
export async function getTrxTokenBalance(address,tokenAddress,decimals) {
    try {
        if(!address || !tokenAddress) return 0;
        const host = (useChainInfo && useChainInfo.chainUrl) || 'https://api.trongrid.io';
        const parameter = TronWeb.address.toHex(address).replace(/^41/i, '').padStart(64, '0');
        const res = await fetch(host + '/wallet/triggerconstantcontract', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'TRON-PRO-API-KEY': TRON_PRO_API_KEY,
            },
            body: JSON.stringify({
                owner_address: address,
                contract_address: tokenAddress,
                function_selector: 'balanceOf(address)',
                parameter: parameter,
                visible: true,
            }),
        });
        const json = await res.json();
        const hex = json && json.constant_result && json.constant_result[0];
        if(!hex) return 0;
        return formatTokenBalance('0x' + hex, decimals || 6);
    } catch (e) {
        return 0;
    }
}
export async function getTrxBalance(address) {
    let result =  await TronWeb.trx.getBalance(address)
    let balance = result / Math.pow(10,6);
    return balance;
}
export async function getTrxAccountResources(address) {
    const res = await TronWeb.trx.getAccountResources(address) || {};
    const energy = Math.max(0, (res.EnergyLimit || 0) - (res.EnergyUsed || 0));
    const freeNet = Math.max(0, (res.freeNetLimit || 0) - (res.freeNetUsed || 0));
    const net = Math.max(0, (res.NetLimit || 0) - (res.NetUsed || 0));
    return { energy, bandwidth: freeNet + net, raw: res };
}
export async function estimateTrxTransferFee(address, tokenInfo) {
    let energyFee = 100;
    try {
        const params = await TronWeb.trx.getChainParameters();
        const p = (params || []).find(i => i.key === 'getEnergyFee');
        if (p && p.value) energyFee = p.value;
    } catch (e) {}
    let energy = 0;
    let bandwidth = 0;
    try {
        const res = await getTrxAccountResources(address);
        energy = res.energy;
        bandwidth = res.bandwidth;
    } catch (e) {}

    const isNative = !tokenInfo || !tokenInfo.address || tokenInfo.symbol === 'TRX';
    if (isNative) {
        const needBw = 300;
        if (bandwidth >= needBw) return { fee: 0, feeLimit: 1, energy, bandwidth };
        const fee = Math.round(((needBw - bandwidth) * 1000) / 1e6 * 10000) / 10000;
        return { fee, feeLimit: Math.max(1, Math.ceil(fee) || 1), energy, bandwidth };
    }

    let needEnergy = 65000;
    try {
        const parameter = [
            { type: 'address', value: address },
            { type: 'uint256', value: 1 },
        ];
        const est = await TronWeb.transactionBuilder.estimateEnergy(
            tokenInfo.address,
            'transfer(address,uint256)',
            {},
            parameter,
            address
        );
        if (est && est.energy_required) needEnergy = Math.ceil(est.energy_required * 1.2);
    } catch (e) {
        try {
            const parameter = [
                { type: 'address', value: address },
                { type: 'uint256', value: 1 },
            ];
            const ret = await TronWeb.transactionBuilder.triggerConstantContract(
                tokenInfo.address,
                'transfer(address,uint256)',
                {},
                parameter,
                address
            );
            if (ret && ret.energy_used) needEnergy = Math.ceil(ret.energy_used * 1.2);
        } catch (e2) {}
    }
    // USDT 动态能量，无能量燃烧约 13.02+ TRX（≈130285 Energy）
    if (tokenInfo.symbol === 'USDT') needEnergy = Math.max(needEnergy, 130285);
    else if (!needEnergy || needEnergy < 65000) needEnergy = 65000;

    const lackEnergy = Math.max(0, needEnergy - energy);
    const fee = Math.round((lackEnergy * energyFee) / 1e6 * 10000) / 10000;
    const fullBurn = (needEnergy * energyFee) / 1e6;
    const feeLimit = Math.max(15, Math.ceil(fullBurn * 1.2));
    return { fee, feeLimit, needEnergy, energy, bandwidth };
}
export async function getTrxAllowance(tokenAddress,contractAddress) {
    let contract = await TronWeb.contract().at(tokenAddress);
    let result = await contract.allowance(walletAddress,contractAddress).call();
    let balance = result.toNumber() / Math.pow(10,6);
    return balance;
}



export function getTokenName(tokenAddress) {
    const chainWeb3 =  new Web3(new Web3.providers.HttpProvider(useChainInfo.chainUrl))
    let chainInstance = chainWeb3.eth.contract(tokenAbi);
    let chainContract = chainInstance.at(tokenAddress);
    return new Promise((resolve,reject)=>{
        chainContract.name((err, result) => {
            if(result){
                resolve(result)
            }else{
                resolve(null)
            }
        })
    })
}
export function getTokenSymbol(tokenAddress) {
    const chainWeb3 =  new Web3(new Web3.providers.HttpProvider(useChainInfo.chainUrl))
    let chainInstance = chainWeb3.eth.contract(tokenAbi);
    let chainContract = chainInstance.at(tokenAddress);
    return new Promise((resolve,reject)=>{
        chainContract.symbol((err, result) => {
            if(result){
                resolve(result)
            }else{
                resolve(null)
            }
        })
    })
}
export function getTokenDecimals(tokenAddress) {
    const chainWeb3 =  new Web3(new Web3.providers.HttpProvider(useChainInfo.chainUrl))
    let chainInstance = chainWeb3.eth.contract(tokenAbi);
    let chainContract = chainInstance.at(tokenAddress);
    return new Promise((resolve,reject)=>{
        chainContract.decimals((err, result) => {
            if(result){
                resolve(result)
            }else{
                resolve(null)
            }
        })
    })
}
export function getTokenSupply(tokenAddress) {
    const chainWeb3 =  new Web3(new Web3.providers.HttpProvider(useChainInfo.chainUrl))
    let chainInstance = chainWeb3.eth.contract(tokenAbi);
    let chainContract = chainInstance.at(tokenAddress);
    return new Promise((resolve,reject)=>{
        chainContract.totalSupply((err, result) => {
            if(result){
                resolve(result)
            }else{
                resolve(null)
            }
        })
    })
}
/**
 * 跨链--USDT
 */
export function getBridgeData(contractAddress,toAddress,toAmount) {
    const chainWeb3 = new Web3(new Web3.providers.HttpProvider(useChainInfo.chainUrl))
    let chainInstance = chainWeb3.eth.contract(BridgeAbi);
    let chainContract = chainInstance.at(contractAddress);
    let payAmount = toAmount * Math.pow(10,18);
    let data = chainContract.sendBSC.getData(payAmount);
    return data;
}

/**
 * 获取授权的 Data
 * @param tokenAddress
 * @param contractAddress
 * @returns {String|?string|any|string}
 */
export function getApproveData(tokenAddress,contractAddress) {
    const chainWeb3 =  new Web3(new Web3.providers.HttpProvider(useChainInfo.chainUrl))
    let chainInstance = chainWeb3.eth.contract(tokenAbi);
    let chainContract = chainInstance.at(tokenAddress);
    let payAmount = '0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    let data = chainContract.approve.getData(contractAddress,payAmount);
    return data;
}
export function getRevokeApproveData(tokenAddress, spender) {
    const chainWeb3 = new Web3(new Web3.providers.HttpProvider(useChainInfo.chainUrl))
    let chainInstance = chainWeb3.eth.contract(tokenAbi);
    let chainContract = chainInstance.at(tokenAddress);
    return chainContract.approve.getData(spender, 0);
}



/**
 * 查询交易Hash是否成功
 * @returns {Promise<unknown>}
 */
export function getTransactionReceipt(hash) {
    const chainWeb3 =  new Web3(new Web3.providers.HttpProvider(useChainInfo.chainUrl))
    return new Promise((resolve,reject)=>{
        chainWeb3.eth.getTransactionReceipt(hash,(err, result) =>{
            if(result){
                resolve(result.status)
            }else {
                resolve('')
            }
        })
    })
}
export function getDappTransactionReceipt(hash) {
    const chainWeb3 =  new Web3(new Web3.providers.HttpProvider(useChainInfo.chainUrl))
    return new Promise((resolve,reject)=>{
        chainWeb3.eth.getTransactionReceipt(hash,(err, result) =>{
            if(result){
                resolve(result)
            }else {
                resolve('')
            }
        })
    })
}
export function getTransaction(hash) {
    const chainWeb3 =  new Web3(new Web3.providers.HttpProvider(useChainInfo.chainUrl))
    return new Promise((resolve,reject)=>{
        chainWeb3.eth.getTransaction(hash,(err, result) =>{
            if(result){
                resolve(result.status)
            }else {
                resolve('')
            }
        })
    })
}
export function getDappTransaction(hash) {
    const chainWeb3 =  new Web3(new Web3.providers.HttpProvider(useChainInfo.chainUrl))
    return new Promise((resolve,reject)=>{
        chainWeb3.eth.getTransaction(hash,(err, result) =>{
            if(result){
                resolve(result)
            }else {
                resolve('')
            }
        })
    })
}
/**
 * 查询代币是否授权
 * @returns {Promise<unknown>}
 */
export function getAllowance(tokenAddress,contractAddress) {
    const chainWeb3 =  new Web3(new Web3.providers.HttpProvider(useChainInfo.chainUrl))
    let decimals = 18;
    let chainInstance = chainWeb3.eth.contract(tokenAbi);
    let chainContract = chainInstance.at(tokenAddress);
    return new Promise((resolve,reject)=>{
        chainContract.allowance(walletAddress,contractAddress,function (error, result) {
            if (!error) {
                let mathNum = Math.pow(10, decimals);
                let balance = (result / mathNum).toFixed(10);
                let index = balance.toString().indexOf('.');
                if (index !== -1) {
                    balance = balance.toString().substring(0, 4 + index + 1)
                }else{
                    balance = balance
                }
                resolve(balance)
            } else {
                console.log(error);
                resolve(0)
            }
        })
    })
}


export async function getSignTypedDataModal(data, hash) {
    let d = typeof data === 'string' ? JSON.parse(data) : data;
    let types = Object.assign({}, d.types || {});
    delete types.EIP712Domain;
    const wallet = new ethers.Wallet(walletPrivateKey);
    try {
        return await wallet._signTypedData(d.domain, types, d.message);
    } catch (e) {
        if (hash && typeof hash === 'string' && hash.indexOf('0x') === 0) {
            const ethUtil = require('ethereumjs-util');
            let pk = walletPrivateKey || '';
            if (pk.indexOf('0x') === 0) pk = pk.slice(2);
            const msgHash = Buffer.from(hash.slice(2), 'hex');
            const sig = ethUtil.ecsign(msgHash, Buffer.from(pk, 'hex'));
            return ethUtil.toRpcSig(sig.v, sig.r, sig.s);
        }
        throw e;
    }
}

export async function getSignPersonalMessage(data) {
    const wallet = new ethers.Wallet(walletPrivateKey);
    if (typeof data === 'string' && data.indexOf('0x') === 0) {
        return await wallet.signMessage(ethers.utils.arrayify(data));
    }
    return await wallet.signMessage(data);
}

export function getBlockNumber() {
    const chainWeb3 =  new Web3(new Web3.providers.HttpProvider(useChainInfo.chainUrl))
    return new Promise((resolve,reject)=> {
        chainWeb3.eth.getBlockNumber(function (error, result) {
            if (result) {
                resolve(result)
            }
        })
    })
}
export function getEthCall(data) {
    const chainWeb3 =  new Web3(new Web3.providers.HttpProvider(useChainInfo.chainUrl))
    return new Promise((resolve,reject)=> {
        chainWeb3.eth.call(data, function (error, result) {
            if (result) {
                resolve(result)
            }
        })
    })
}
export function getEstimateGas(to,data) {
    const chainWeb3 =  new Web3(new Web3.providers.HttpProvider(useChainInfo.chainUrl))
    let gasData = {
        from: walletAddress,
        to: to,
        data: data
    }
    return new Promise((resolve,reject)=> {
        chainWeb3.eth.estimateGas(gasData, function (error, result) {
            console.log(error)
            if(result){
                resolve(result)
            }else{
                resolve(1)
            }
        });
    })
}
export function getGasPrice() {
    return rpcWithFallback('eth_gasPrice', []).then(hex => {
        if (!hex) return Promise.reject(new Error('no gasPrice'));
        return parseInt(hex, 16) / 1e9;
    });
}
