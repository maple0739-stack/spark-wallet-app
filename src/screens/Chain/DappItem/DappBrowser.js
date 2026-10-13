/**
 * Created by zh. on 2019/09/01.
 */

import React, {Component,createRef} from 'react';
import {
    View,
    Platform, Text, TouchableOpacity, StyleSheet, Alert, Linking, Clipboard, Image, DeviceEventEmitter,
} from 'react-native' ;
import { WebView } from "react-native-webview";
import Web3 from 'web3';
import RNFS from 'react-native-fs';
import {Overlay} from "teaset";
import {Input} from 'react-native-elements';
import AntDesign from "react-native-vector-icons/AntDesign";
import LinearGradient from "react-native-linear-gradient";
import {Images} from '../../../resource';
import Tx from 'ethereumjs-tx';
import {CHAIN_LIST} from '../../../blockchain/ChainInfo';

const UA_DESKTOP = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const UA_IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1';
const UA_ANDROID = 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';

export default class DappBrowser extends Component {
    constructor(props) {
        super(props);
        // 状态
        this.state = {
            browserUrl:'',
            web3JsContent: '',
            ethersJsContent: '',
            progressWidth: 0.1 * WIDTH,
            walletInfoList:[],
            title:'...',
            passwordSwitch:true
        };
        this.webview = createRef();
        this.web3 =  new Web3(new Web3.providers.HttpProvider(useChainInfo.chainUrl))
    }
    static navigationOptions = {
        header: null,
    };
    componentDidMount(){
        //密码开关
        storage.load({
            key: 'PasswordSwitch'
        }).then(data => {
            this.setState({
                passwordSwitch:data
            })
        }).catch(e=>{

        })

        //获取钱包列表
        storage.load({
            key: 'WalletInfoList'
        }).then(data => {
            this.setState({
                walletInfoList: data
            })
            this.queryBalance(data)
        }).catch(e=>{
        })

        const { params } = this.props.navigation.state;
        this.setState({
            browserUrl:params.browserUrl
        })
        const { web3JsContent } = this.state;
        if (web3JsContent === '') {
            if (Platform.OS === 'ios') {
                RNFS.readFile(`${RNFS.MainBundlePath}/trust-min.js`, 'utf8')
                    .then((content) => {
                        this.setState({ web3JsContent: content }, () => this.injectWalletIfReady());
                    });
            } else {
                RNFS.readFileAssets('trust-min.js', 'utf8')
                    .then((content) => {
                        this.setState({ web3JsContent: content }, () => this.injectWalletIfReady());
                    });
            }
        }
    }
    //查询钱包余额
    queryBalance(walletData){
        walletData.map((item,index)=>{
            BlockChainService.getBalance(item.address,'').then(data => {
                if(data){
                    this.setState({
                        [item.address]: data
                    });
                }
            })
        })
    }
    postMessageToWebView = (id, err, result) => {
        console.log('[DappBrowser] postMessageToWebView', { id, err, result });
        if (this.webview && this.webview.current) {
            let jsToRun;
            if (err) {
                jsToRun = `
                    if (window.ethereum) {
                        window.ethereum.sendError(${id}, ${JSON.stringify(err)});
                    }
                    true;
                `;
            } else {
                jsToRun = `
                    if (window.ethereum) {
                        window.ethereum.sendResponse(${id}, ${JSON.stringify(result)});
                    }
                    true;
                `;
            }
            this.webview.current.injectJavaScript(jsToRun);
        } else {
            console.log('[DappBrowser] webview missing, cannot reply');
        }
    }
    popupTransactionModal = async (payload) => {
        const { id, object } = payload;
        console.log('[DappBrowser] popupTransactionModal', id, object);
        this.transactionPull(id,object);
    }
    handleRequestAccounts = async (payload) => {
        const { id } = payload;
        console.log('[DappBrowser] requestAccounts', id, walletAddress);
        this.postMessageToWebView(id,null,[walletAddress]);
    }
    popupSignTypedDataModal = async (payload) => {
        const { id,object } = payload;
        console.log('[DappBrowser] signTypedMessage', id, object && object.raw && String(object.raw).slice(0, 200));
        try {
            const data = await BlockChainService.getSignTypedDataModal(object.raw, object.data);
            console.log('[DappBrowser] signTypedMessage result', data);
            if(data){
                this.postMessageToWebView(id,null,data);
            }else{
                this.postMessageToWebView(id,'sign typed data failed',null);
            }
        } catch (e) {
            console.log('[DappBrowser] signTypedData error', e);
            this.postMessageToWebView(id, String(e && e.message || e), null);
        }
    }
    handSignPersonalMessage = async (payload) => {
        const { id,object } = payload;
        console.log('[DappBrowser] signPersonalMessage', id, object && object.data);
        try {
            const data = await BlockChainService.getSignPersonalMessage(object.data);
            console.log('[DappBrowser] signPersonalMessage result', data);
            if(data){
                this.postMessageToWebView(id,null,data);
            }else{
                this.postMessageToWebView(id,'sign failed',null);
            }
        } catch (e) {
            console.log('[DappBrowser] signPersonal error', e);
            this.postMessageToWebView(id, String(e && e.message || e), null);
        }
    }
    onMessage = async (event) => {
        let payload;
        try {
            const { data } = event.nativeEvent;
            console.log('[DappBrowser] onMessage raw=', typeof data, data && String(data).slice(0, 500));
            if (!data || data === 'undefined') return;
            payload = typeof data === 'string' ? JSON.parse(data) : data;
            if (!payload || !payload.name) {
                console.log('[DappBrowser] onMessage ignore (no name)', payload);
                return;
            }
            console.log('[DappBrowser] onMessage payload=', payload);
            const { name } = payload;

            switch (name) {
                case 'requestAccounts': {
                    await this.handleRequestAccounts(payload);
                    break;
                }
                case 'signTransaction': {
                    console.log('[DappBrowser] >>> signTransaction');
                    await this.popupTransactionModal(payload);
                    break;
                }
                case 'signTypedMessage': {
                    console.log('[DappBrowser] >>> signTypedMessage');
                    await this.popupSignTypedDataModal(payload);
                    break;
                }
                case 'signPersonalMessage':
                case 'signMessage': {
                    console.log('[DappBrowser] >>>', name);
                    await this.handSignPersonalMessage(payload);
                    break;
                }
                default:
                    console.log('[DappBrowser] unknown message name=', name);
                    break;
            }
        } catch (err) {
            console.log('[DappBrowser] onMessage error: ', err);
            if (payload && payload.id != null) {
                this.postMessageToWebView(payload.id, String(err && err.message || err), null);
            }
        }
    }
    confirmTransaction(id,params){
        console.log('[DappBrowser] confirmTransaction', id, params);
        const {to, data, gasPrice, gas, gasLimit, value, maxFeePerGas, maxPriorityFeePerGas} = params || {};
        let _gasPrice = gasPrice || maxFeePerGas || maxPriorityFeePerGas;
        let _gasLimit = gas || gasLimit;
        const {password,passwordSwitch} = this.state;
        if(passwordSwitch && password !== walletPassword){
            console.log('[DappBrowser] password error');
            Toast.info(lan.t('wallet.passwordError'));
            return ;
        }
        if(_gasPrice){
            try {
                _gasPrice = this.web3.toBigNumber(_gasPrice).div(1e9).toNumber();
            } catch (e) {
                _gasPrice = 0;
            }
        } else {
            _gasPrice = 0;
        }
        if(!_gasLimit){
            _gasLimit = 1000000;
        }else{
            try {
                _gasLimit = this.web3.toBigNumber(_gasLimit).toNumber();
            } catch (e) {
                _gasLimit = 1000000;
            }
        }
        console.log('[DappBrowser] broadcast params', { to, _gasLimit, _gasPrice, value, chainId: useChainInfo && useChainInfo.chainId });
        this.sigTransactionBroadcast(to, data, _gasLimit, _gasPrice, value || 0, id);
    }
    sigTransactionBroadcast(contractAddress,data,limit,gwei,rawValue,id){
        let that = this;
        const chainId = Number(useChainInfo.chainId);
        const rpcList = chainId === 56 ? [
            'https://bsc-dataseed1.bnbchain.org',
            'https://bsc-dataseed2.bnbchain.org',
            'https://bsc-dataseed.binance.org',
            'https://bsc-rpc.publicnode.com',
        ] : [useChainInfo.chainUrl];
        console.log('[DappBrowser] sigTransactionBroadcast start', { contractAddress, limit, gwei, rawValue, id, rpcList });
        const chainWeb3 = new Web3(new Web3.providers.HttpProvider(rpcList[0]));
        const fail = (msg) => {
            console.log('[DappBrowser] broadcast FAIL', msg);
            Toast.info(String(msg || lan.t('all.chainFail')).slice(0, 120));
            that.postMessageToWebView(id, String(msg || 'fail'), null);
        };
        const rpcOnce = (url, method, params, timeoutMs) => new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error('rpc timeout ' + method + ' ' + url)), timeoutMs || 12000);
            fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }),
            }).then(r => r.json()).then(j => {
                clearTimeout(timer);
                console.log('[DappBrowser] rpc', method, url, j && (j.result || j.error));
                if (j.error) reject(j.error);
                else resolve(j.result);
            }).catch((e) => {
                clearTimeout(timer);
                reject(e);
            });
        });
        const rpc = (method, params) => {
            let p = Promise.reject(new Error('no rpc'));
            rpcList.forEach((url) => {
                p = p.catch(() => rpcOnce(url, method, params, method === 'eth_sendRawTransaction' ? 20000 : 10000));
            });
            return p;
        };

        const doSend = (nonce, gweiPrice) => {
            try {
                let gasPrice = chainWeb3.toBigNumber(gweiPrice).times(1e9);
                let valueBN = chainWeb3.toBigNumber(rawValue || 0);
                let gasLimitNum = Number(limit) || 100000;
                if (data && data.indexOf('0x095ea7b3') === 0) {
                    gasLimitNum = Math.max(gasLimitNum * 2, 120000);
                } else if (data && data !== '0x') {
                    gasLimitNum = Math.max(Math.floor(gasLimitNum * 1.3), gasLimitNum);
                }
                let transaction = {
                    chainId: chainId,
                    nonce: Number(nonce),
                    gasPrice: chainWeb3.toHex(gasPrice),
                    gasLimit: chainWeb3.toHex(gasLimitNum),
                    to: contractAddress,
                    value: chainWeb3.toHex(valueBN),
                    data: data || '0x',
                };
                console.log('[DappBrowser] raw tx=', transaction);
                let private_key = walletPrivateKey || '';
                if (private_key.substring(0,2) === '0x') {
                    private_key = private_key.substring(2);
                }
                if (!private_key) {
                    fail('私钥为空');
                    return;
                }
                let tx = new Tx(transaction);
                let prk = new Buffer(private_key, 'hex');
                tx.sign(prk);
                const raw = '0x' + tx.serialize().toString('hex');
                console.log('[DappBrowser] sendRawTransaction len=', raw.length, 'from=', walletAddress, 'gasLimit=', gasLimitNum);
                rpc('eth_sendRawTransaction', [raw]).then((hash) => {
                    console.log('[DappBrowser] send ok hash=', hash);
                    that.overlayApproveView && that.overlayApproveView.close();
                    Toast.success(lan.t('all.chainSuccess'));
                    that.postMessageToWebView(id, null, hash);
                }).catch((err) => {
                    const msg = (err && (err.message || err.data || JSON.stringify(err))) || 'broadcast fail';
                    console.log('[DappBrowser] send err', err);
                    fail(msg);
                });
            } catch (e) {
                console.log('[DappBrowser] sign tx error', e);
                fail(e && e.message || e);
            }
        };

        Promise.all([
            rpc('eth_getTransactionCount', [walletAddress, 'pending']),
            gwei > 0 ? Promise.resolve(null) : rpc('eth_gasPrice', []),
        ]).then(([nonceHex, gasPriceHex]) => {
            const nonce = parseInt(nonceHex, 16);
            let gweiPrice = gwei;
            if (!gweiPrice && gasPriceHex) {
                gweiPrice = chainWeb3.toBigNumber(gasPriceHex).div(1e9).toNumber();
                if (gweiPrice < 1) gweiPrice = 1;
                gweiPrice = Math.ceil(gweiPrice * 1.2 * 100) / 100;
            }
            if (!gweiPrice) gweiPrice = chainId === 1 ? 20 : 5;
            console.log('[DappBrowser] nonce=', nonce, 'gwei=', gweiPrice);
            doSend(nonce, gweiPrice);
        }).catch((e) => {
            console.log('[DappBrowser] prepare err', e);
            fail(e && (e.message || JSON.stringify(e)) || e);
        });
    }
    onNavigationStateChange = (navState) => {
        if (navState) {
            const { canGoBack, title } = navState;
            const next = { canGoBack };
            if (title) next.title = title.substring(0, 20);
            this.setState(next);
        }
    }
    onLoadEnd = async ({ nativeEvent }) => {
        let title = nativeEvent.title;
        title = title.substring(0,20);
        Loading.hide();
        this.setState({
            progressWidth: 0,
            title: title
        })
        if (this.isCloudflareChallenge(nativeEvent.title)) {
            return;
        }
        this.injectWalletIfReady();
    }
    onLoadStart = () => {
        if (this.needsEarlyInject() && this.webview && this.webview.current) {
            this.webview.current.injectJavaScript(this.getJsCode());
        }
    }
    onLoadProgress = async ({ nativeEvent }) => {
        let progress = parseFloat(nativeEvent.progress);
        console.log("progress",progress)
        if(progress == 1){
            this.setState({
                progressWidth:  WIDTH
            })
        }else{
            let progressWidth = 1-progress;
            this.setState({
                progressWidth: progressWidth.toFixed(2) * WIDTH
            })
        }
        if (this.isBridgers() || this.isCloudflareChallenge(this.state.title)) {
            return;
        }
        if(progress > 0.2 && this.webview && this.webview.current){
            this.webview.current.injectJavaScript(this.getJsCode());
        }
    }
    onError = ({ nativeEvent: errorInfo }) => {
        Loading.hide()
    };
    injectWalletIfReady = () => {
        if (!this.state.web3JsContent) return;
        if (this.isCloudflareChallenge(this.state.title)) return;
        if (this.webview && this.webview.current) {
            this.webview.current.injectJavaScript(this.getJsCode());
        }
    }
    isUniswap = () => {
        const url = (this.state.browserUrl || '').toLowerCase();
        return url.indexOf('uniswap') >= 0 || url.indexOf('sushi.com') >= 0;
    }
    isBridgers = () => {
        const url = (this.state.browserUrl || '').toLowerCase();
        return url.indexOf('bridgers') >= 0;
    }
    isCloudflareChallenge = (title) => {
        const t = (title || '').toLowerCase();
        return t.indexOf('just a moment') >= 0
            || t.indexOf('请稍候') >= 0
            || t.indexOf('checking your browser') >= 0
            || t.indexOf('attention required') >= 0
            || t.indexOf('正在验证') >= 0
            || t.indexOf('verify you are human') >= 0;
    }
    needsEarlyInject = () => {
        return this.isUniswap();
    }
    getUserAgent = () => {
        if (this.isUniswap()) return UA_DESKTOP;
        if (this.isBridgers()) return null;
        return Platform.OS === 'android' ? UA_ANDROID : UA_IOS;
    }
    getJsCode = () => {
        let address = walletAddress || '';
        let chainInfo = useChainInfo || CHAIN_LIST.BNB;
        let chainId = Number(chainInfo.chainId) || 56;
        let chainUrl = (chainInfo.chainUrl || '').replace(/'/g, '');
        if (chainId === 56) {
            chainUrl = 'https://bsc-dataseed1.bnbchain.org';
        }
        const { web3JsContent } = this.state;
        const needEip6963 = this.isUniswap();
        return `
          (function() {
            if (!window.trustwallet) {
              ${web3JsContent}
            }
            if (!window.trustwallet) { return; }
            window.trustwallet.postMessage = function(data) {
              try {
                window.ReactNativeWebView.postMessage(typeof data === 'string' ? data : JSON.stringify(data));
              } catch (e) {}
            };
            var config = {
                    chainId: ${chainId},
                    rpcUrl: '${chainUrl}',
                    address: '${address}',
                    isDebug: true
            };
            var provider = window.ethereum;
            if (!(provider && provider.isTrust && provider.setConfig)) {
              provider = new window.trustwallet.Provider(config);
              provider.isMetaMask = true;
              provider.isPyy = true;
              provider.isTrust = true;
              provider._metamask = { isUnlocked: function() { return Promise.resolve(true); } };
              window.ethereum = provider;
              window.web3 = new window.trustwallet.Web3(provider);
            } else {
              try { provider.setConfig(config); } catch (e) {}
            }
            if (!provider.__sparkReqWrapped) {
              provider.__sparkBaseRequest = provider.request.bind(provider);
              provider.__sparkReqWrapped = true;
            }
            var _req = provider.__sparkBaseRequest;
            var chainIdHex = '0x' + Number(${chainId}).toString(16);
            var rpcUrl = '${chainUrl}';
            var rpcFetch = function(method, params) {
              return fetch(rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method: method, params: params || [] })
              }).then(function(r) { return r.json(); }).then(function(j) {
                console.log('[SparkEth] rpcFetch', method, j);
                if (j.error) {
                  var err = new Error(j.error.message || 'rpc error');
                  err.code = j.error.code;
                  err.data = j.error.data;
                  throw err;
                }
                return j.result;
              });
            };
            var rpcMethods = {
              eth_call: 1,
              eth_estimateGas: 1,
              eth_blockNumber: 1,
              eth_gasPrice: 1,
              eth_getBalance: 1,
              eth_getCode: 1,
              eth_getLogs: 1,
              eth_getStorageAt: 1,
              eth_getTransactionCount: 1,
              eth_getTransactionByHash: 1,
              eth_getTransactionReceipt: 1,
              eth_getBlockByNumber: 1,
              eth_getBlockByHash: 1,
              net_version: 1
            };
            provider.request = function(payload) {
              try {
                console.log('[SparkEth] request', payload && payload.method);
              } catch (e) {}
              try {
                if (payload && payload.params && payload.params[1] && typeof payload.params[1] !== 'string'
                  && (payload.method === 'eth_signTypedData' || payload.method === 'eth_signTypedData_v3' || payload.method === 'eth_signTypedData_v4')) {
                  payload = Object.assign({}, payload, { params: [payload.params[0], JSON.stringify(payload.params[1])] });
                }
              } catch (e) {}
              if (payload && payload.method === 'wallet_getCapabilities') {
                var caps = {};
                caps[chainIdHex] = {
                  atomicBatch: { supported: false },
                  paymasterService: { supported: false },
                  auxiliaryFunds: { supported: false }
                };
                return Promise.resolve(caps);
              }
              if (payload && (payload.method === 'wallet_sendCalls' || payload.method === 'wallet_getCallsStatus' || payload.method === 'wallet_showCallsStatus')) {
                return Promise.reject({ code: 4200, message: 'Method not supported: ' + payload.method });
              }
              if (payload && payload.method === 'wallet_switchEthereumChain') {
                var cid = (payload.params && payload.params[0] && payload.params[0].chainId) || '0x0';
                var target = typeof cid === 'string' ? parseInt(cid, 16) : Number(cid);
                if (target === ${chainId}) { return Promise.resolve(null); }
              }
              if (payload && rpcMethods[payload.method]) {
                return rpcFetch(payload.method, payload.params || []).then(function(res) {
                  console.log('[SparkEth] rpc ok', payload.method);
                  return res;
                }).catch(function(err) {
                  console.log('[SparkEth] rpc err', payload.method, err);
                  if (payload.method === 'eth_estimateGas') {
                    var msg = '';
                    try { msg = (err && (err.message || err.data || '') || '') + ''; } catch (e) {}
                    msg = msg.toLowerCase();
                    var isRevert = msg.indexOf('revert') >= 0 || msg.indexOf('allowance') >= 0 || msg.indexOf('transfer') >= 0 || msg.indexOf('insufficient') >= 0 || msg.indexOf('execution') >= 0 || msg.indexOf('gas required') >= 0;
                    if (!isRevert) {
                      console.log('[SparkEth] estimateGas rpc fallback 1000000');
                      return '0xf4240';
                    }
                  }
                  throw err;
                });
              }
              return _req(payload).then(function(res) {
                console.log('[SparkEth] request ok', payload && payload.method, res);
                return res;
              }).catch(function(err) {
                console.log('[SparkEth] request err', payload && payload.method, err);
                throw err;
              });
            };
            try {
              var syncFrames = function() {
                for (var i = 0; i < window.frames.length; i++) {
                  try {
                    var f = window.frames[i];
                    if (f) {
                      f.ethereum = window.ethereum;
                      f.trustwallet = window.trustwallet;
                    }
                  } catch (e) {}
                }
              };
              syncFrames();
              if (!window.__sparkFrameTimer) {
                window.__sparkFrameTimer = setInterval(syncFrames, 1500);
              }
            } catch (e) {}
            console.log('[SparkEth] injected', { chainId: ${chainId}, address: '${address}', rpc: '${chainUrl}' });
            ${needEip6963 ? `
            if (!window.__sparkEip6963) {
              window.__sparkEip6963 = true;
              var eip6963Info = {
                uuid: '350670db-4efa-4ff0-823e-5e8c8c1c2a11',
                name: 'Spark Wallet',
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle fill="%23FF007A" cx="16" cy="16" r="16"/></svg>',
                rdns: 'app.spark.wallet'
              };
              var announce = function() {
                window.dispatchEvent(new CustomEvent('eip6963:announceProvider', {
                  detail: Object.freeze({ info: eip6963Info, provider: window.ethereum })
                }));
              };
              window.addEventListener('eip6963:requestProvider', function() { announce(); });
              announce();
              window.dispatchEvent(new Event('ethereum#initialized'));
            }
            ` : ''}
            window.__sparkEthInjected = true;
          })();
          true;
        `;
    }
    //复制URL
    copyUrl(){
        let {browserUrl} = this.state
        Toast.success(lan.t('all.copyAddress')+"："+browserUrl);
        Clipboard.setString(browserUrl);
    }

    copyData(data){
        Toast.success(lan.t('all.copyAddress'));
        Clipboard.setString(data);
    }
    getDappBrowser(){
        let {browserUrl} = this.state
        this.props.navigation.push('DappBrowser',{browserUrl:browserUrl})
    }
    //切换钱包
    useWallet(walletData){
        //保存当前的钱包信息
        storage.save({
            key: 'UseWallet',
            data: walletData
        });
        DeviceEventEmitter.emit("updateUseWallet", "");
        walletAddress = walletData.address;
        this.getDappBrowser();
    }
    // 渲染
    render() {
        let {browserUrl,web3JsContent,progressWidth,title} = this.state
        const jsCode = this.getJsCode();
        return (
            <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
                <View style={{height:Platform.OS === 'ios'?p(160):p(130),justifyContent: 'center'}}>
                    <View style={{justifyContent: 'center',alignItems:'center'}}>
                        <View style={{justifyContent:'space-between',flexDirection:'row',
                            alignItems:'center',marginTop:p(50),width:WIDTH-p(30)}}>
                            <TouchableOpacity
                                style={{width:p(65),height:p(55)}}
                                onPress={()=>this.props.navigation.pop()}>
                                <AntDesign
                                    name='left'
                                    size={20}
                                    color={Theme.textColor}
                                />
                            </TouchableOpacity>
                            <Text style={{fontSize:p(26),color:Theme.textColor,fontWeight:'500'}}>
                                {title}
                            </Text>
                            <TouchableOpacity
                                onPress={()=> this.showOperationPull()}>
                                <AntDesign
                                    name='bars'
                                    size={22}
                                    color={Theme.textColor}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {
                    parseFloat(progressWidth)>0
                        ?<View style={{width: progressWidth,height:p(5),backgroundColor:'#3c82e9'}}/>
                        :null
                }
                {
                    browserUrl && (web3JsContent || this.isBridgers()) ?
                        <WebView
                            ref={this.webview}
                            javaScriptEnabled={true}
                            domStorageEnabled={true}
                            originWhitelist={['*', 'http://*', 'https://*', 'about:blank', 'about:srcdoc']}
                            mixedContentMode="always"
                            allowsInlineMediaPlayback={true}
                            mediaPlaybackRequiresUserAction={false}
                            allowFileAccess={true}
                            allowUniversalAccessFromFileURLs={true}
                            geolocationEnabled={true}
                            incognito={false}
                            cacheEnabled={true}
                            thirdPartyCookiesEnabled={true}
                            sharedCookiesEnabled={true}
                            setSupportMultipleWindows={false}
                            {...(this.getUserAgent() ? { userAgent: this.getUserAgent() } : {})}
                            onNavigationStateChange={this.onNavigationStateChange}
                            onMessage={this.onMessage}
                            onShouldStartLoadWithRequest={() => true}
                            onLoadStart={this.onLoadStart}
                            onLoadProgress={this.onLoadProgress}
                            onError={this.onError}
                            onLoadEnd={this.onLoadEnd}
                            injectedJavaScriptBeforeContentLoaded={this.needsEarlyInject() ? jsCode : undefined}
                            style={{ width: WIDTH, height: HEIGHT }}
                            source={{ uri: browserUrl }}
                        />
                        :null
                }



            </View>
        )
    }

    closeTransactionPull(id){
        if (id != null) {
            this.postMessageToWebView(id, 'user rejected', null);
        }
        this.overlayApproveView && this.overlayApproveView.close();
    }
    transactionPull(id,params){
        let {passwordSwitch} = this.state;
        const { gas,gasPrice,from,to, data,value } = params || {};
        let gasPrices = gasPrice || (params && params.maxFeePerGas);
        let gasLimit = gas || (params && params.gasLimit);
        let name;
        if(!data){
            name = 'transfer'
        }else{
            name = data.substring(0,10);
            if(name === '0x095ea7b3'){
                name = 'approve'
            }else if(name === '0xa9059cbb'){
                name = 'transfer'
            }else if(name === '0x38ed1739'){
                name = 'swapExactTokensForTokens'
            }else if(name === '0x7ff36ab5'){
                name = 'swapExactETHForTokens'
            }else if(name === '0x18cbafe5'){
                name = 'swapExactTokensForETH'
            }else if(name === '0x4a25d94a'){
                name = 'swapTokensForExactETH'
            }else if(name === '0x8803dbee'){
                name = 'swapTokensForExactTokens'
            }else if(name === '0xfb3bdb41'){
                name = 'swapETHForExactTokens'
            }
        }
        let amount = '0';
        try {
            amount = this.web3.fromWei(value || 0);
        } catch (e) {
            amount = '0';
        }
        if(!gasPrices){
            gasPrices = 3 * Math.pow(10,9);
        }
        let _gasPrice = this.web3.fromWei(gasPrices) * Math.pow(10,18)
        if(!gasLimit){
            gasLimit = this.isBridgers() ? 800000 : 300000
        }
        let _gas = this.web3.fromWei(gasLimit) * Math.pow(10,18)
        console.log(_gas)
        let mineFee = (_gasPrice * _gas) / Math.pow(10,18);
        let overlayApproveView = (
            <Overlay.PullView  side='bottom' ref={v => this.overlayApproveView = v}>
                <View style={{backgroundColor: '#FFF'}}>

                    <View style={{alignItems:'center',justifyContent:'space-between',flexDirection:'row',
                        height:p(80), borderBottomWidth:p(1),borderBottomColor:'#eceaea'}}>
                        <Text></Text>
                        <Text style={{color:'#474545',fontSize:p(30),fontWeight:'500'}}>
                            {lan.t('pay.jiaoyiqueren')}
                        </Text>
                        <TouchableOpacity
                            style={{marginRight:p(20)}}
                            onPress={() => this.closeTransactionPull(id)}>
                            <Text style={{color:'#474545',fontSize:p(32)}}>X</Text>
                        </TouchableOpacity>
                    </View>
                        <View style={{height:p(100),justifyContent:'center',alignItems:'center',left:-p(20)}}>
                            <Text style={{fontSize: p(30),color:'#292929',fontWeight:'500'}}>
                                {amount} {useChainInfo.chainSymbol}
                            </Text>
                        </View>
                        <View style={styles.ViewSty}>
                            <Text style={styles.Text_06}>
                                {lan.t('pay.fukuandizhi')}：
                            </Text>
                            <View style={{width:WIDTH-p(200)}}>
                                <Text style={styles.Text_01}>
                                    {from}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.ViewSty}>
                            <Text style={styles.Text_06}>
                                {lan.t('pay.jieshoudizhi')}：
                            </Text>
                            <View style={{width:WIDTH-p(200)}}>
                                <Text style={styles.Text_01}>
                                    {to}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.ViewSty}>
                            <Text style={styles.Text_06}>
                                {lan.t('pay.jiaoyishuju')}：
                            </Text>
                            <Text style={styles.Text_01}>
                                {name}...
                            </Text>
                            <TouchableOpacity
                                onPress={()=>Alert.alert(
                                    lan.t('pay.jiaoyishuju'),
                                    data,
                                    [
                                        {text: lan.t('pay.queding')}
                                    ])}
                                style={{borderBottomWidth:p(1),borderBottomColor:'#bd9212',
                                    justifyContent: 'center',alignItems: 'center',marginLeft:p(40)}}>
                                <Text style={{fontSize:p(26),color:'#bd9212'}}>
                                    {lan.t('pay.xiangqing')}：
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={()=>this.copyData(data)}
                                style={{borderBottomWidth:p(1),borderBottomColor:'#bd9212',
                                    justifyContent: 'center',alignItems: 'center',marginLeft:p(40)}}>
                                <Text style={{fontSize:p(26),color:'#bd9212'}}>
                                    {lan.t('pay.fuzhi')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.ViewSty}>
                            <Text style={styles.Text_06}>
                                {lan.t('pay.kuanggongfeiyong')}：≈ {mineFee} {useChainInfo.chainSymbol}
                            </Text>
                        </View>
                    {
                        passwordSwitch?
                            <View style={{marginLeft:p(20),marginTop: p(30),flexDirection:'row',alignItems:'center'}}>
                                <Text style={{fontSize:p(26),color:'#333333'}}>
                                    {lan.t('pay.zhifumima')}：
                                </Text>
                                <View style={{width:WIDTH-p(260)}}>
                                    <Input
                                        secureTextEntry={true}
                                        leftIcon={
                                            <AntDesign
                                                name='unlock'
                                                size={24}
                                                color='#333333'
                                                style={{left:-p(20)}}
                                            />
                                        }
                                        inputContainerStyle={{borderColor:'#E7E7E7',borderWidth:p(1),borderRadius:p(10)}}
                                        onChangeText={(password) => this.setState({password})}
                                    />
                                </View>
                            </View>
                            :null
                    }



                    <View style={{justifyContent:'center',alignItems:'center',marginTop: p(50),marginBottom:p(50)}} >
                        <TouchableOpacity onPress={()=>this.confirmTransaction(id,params)}>
                            <LinearGradient
                                start={{x: 0.25, y: 0.25}}
                                end={{x: 0.75, y: 0.75}}
                                colors={['#FFD24C', '#FFD24C', '#FFD24C']}
                                style={styles.linearGradient}>
                                <Text style={styles.buttonText}>
                                    {lan.t('all.confirm')}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                </View>
            </Overlay.PullView>
        );
        Overlay.show(overlayApproveView);
    }
    showWalletPull() {
        let {walletInfoList} = this.state;
        let overlayView = (
            <Overlay.PullView
                ref={v => this.overlayWalletPullView = v}
            >
                <View style={{width:WIDTH,backgroundColor: '#FFF'}}>
                    <View style={{}}>
                        <View style={{justifyContent:'center',alignItems:'center',height:p(90)
                            ,borderBottomColor:'#f5f3f3',borderBottomWidth:p(1),flexDirection:'row'}}>
                            <AntDesign
                                name='solution1'
                                size={20}
                                color={'#585656'}
                            />
                            <Text style={{color:'#333333',fontSize:p(28),marginLeft:p(10)}}>
                                {lan.t('dapp.qiehuanzhanghao')}
                            </Text>
                        </View>
                        <View>
                            {
                                walletInfoList.map((item,index)=>{
                                    let walletName = item.name?item.name:lan.t('pcd.qb')+(index+1)
                                    return(
                                        <TouchableOpacity
                                            onPress={()=>this.overlayWalletPullView.close() && this.useWallet(item)}
                                            style={styles.linearGradient2} key={index}>
                                            <View style={{flexDirection: 'row',alignItems:'center',
                                                justifyContent:'space-between',width:WIDTH-p(50)}}>
                                                <View style={{width:WIDTH/2}}>
                                                    <View style={{flexDirection: 'row',alignItems:'center'}}>
                                                        <Image style={{width:p(50),height:p(50),marginRight: p(15)}}
                                                               source={Images.token[useChainInfo.chainSymbol]}/>
                                                        <Text style={{color:'#138389',fontSize:p(26)}}>
                                                            {walletName}
                                                        </Text>
                                                    </View>
                                                    <Text style={{color:'#373535',fontSize:p(26),marginTop:p(10)}}>
                                                        {item.address}
                                                    </Text>
                                                </View>

                                                <View style={{width:WIDTH/3,alignItems:'flex-end'}}>
                                                    <Text style={{fontSize:p(28),color:'#333333'}}>
                                                        { this.state[item.address]?
                                                            this.state[item.address]
                                                            :'0.00'} {useChainInfo.chainSymbol}
                                                    </Text>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    )
                                })
                            }
                        </View>
                        <View style={{height:p(20),width:WIDTH,backgroundColor:'#f5f3f3'}}/>
                        <TouchableOpacity
                            onPress={() => this.overlayWalletPullView.close()}
                            style={{justifyContent:'center',alignItems: 'center',height:p(85)}}>
                            <Text style={{fontSize: p(26),color:'#333333'}}>
                                {lan.t('all.cancel')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>


            </Overlay.PullView>
        );
        Overlay.show(overlayView);
    }

    showOperationPull() {
        let {browserUrl} = this.state
        let a = browserUrl.split('//');
        let b = a[1].split("/");
        let overlayView = (
            <Overlay.PullView
                ref={v => this.overlayOperationPullView = v}
            >
                <View style={{width:WIDTH,backgroundColor: '#f8f8f8'}}>
                    <View style={{}}>
                        {/*<View style={{justifyContent:'center',marginTop:p(40),alignItems:'center',marginBottom:p(30)}}>
                            <Text style={{color:'#7c7e7e',fontSize:p(24)}}>
                                此DAPP由{b[0]}提供
                            </Text>
                        </View>*/}
                        <View style={{justifyContent:'center',alignItems:'center'}}>
                            <View style={{flexDirection:'row',flexWrap:'wrap',width:WIDTH}}>
                                <TouchableOpacity onPress={()=>this.overlayOperationPullView.close() && this.showWalletPull()}
                                                  style={styles.View_05}>
                                    <AntDesign
                                        name='solution1'
                                        size={24}
                                        color={'#585656'}
                                    />
                                    <Text style={styles.Text_03}>
                                        {lan.t('dapp.qiehuanzhanghao')}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={()=>this.overlayOperationPullView.close() && this.getDappBrowser()}
                                                  style={styles.View_05}>
                                    <AntDesign
                                        name='reload1'
                                        size={24}
                                        color={'#585656'}
                                    />
                                    <Text style={styles.Text_03}>
                                        {lan.t('dapp.shuaxin')}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity onPress={()=>this.copyUrl()}
                                                  style={styles.View_05}>
                                    <AntDesign
                                        name='link'
                                        size={24}
                                        color={'#585656'}
                                    />
                                    <Text style={styles.Text_03}>
                                        {lan.t('dapp.fuzhiurl')}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={()=>Linking.openURL(browserUrl)}
                                                  style={styles.View_05}>
                                    <AntDesign
                                        name='chrome'
                                        size={24}
                                        color={'#585656'}
                                    />
                                    <Text style={styles.Text_03}>
                                        {lan.t('dapp.liulanqidakai')}
                                    </Text>
                                </TouchableOpacity>

                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={() => this.overlayOperationPullView && this.overlayOperationPullView.close()}
                            style={{justifyContent:'center',alignItems: 'center',height:p(85),backgroundColor: '#FFFFFF',
                                marginTop: p(50)}}>
                            <Text style={{fontSize: p(26),color:'#333333'}}>
                                {lan.t('all.cancel')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>


            </Overlay.PullView>
        );
        Overlay.show(overlayView);
    }
}

const styles = StyleSheet.create({
    linearGradient2: {
        justifyContent:'center',
        flexDirection: 'row',
        alignItems:'center',
        borderBottomColor:'#f5f3f3',
        borderBottomWidth:p(1),
        height:p(155),
    },
    Text_03:{
        fontSize:p(24),
        color:'#2b2a2a',
        marginTop:p(20)
    },
    View_05:{
        justifyContent:'center',
        alignItems:'center',
        width:WIDTH/5,
        height:p(130),
        backgroundColor:'#FFFFFF',
        borderRadius: p(20),
        marginLeft: p(30),
        marginTop: p(20)
    },
    ViewSty:{
        flexDirection:'row',
        borderBottomWidth:p(1),
        borderBottomColor:'#eceaea',
        marginLeft:p(20),
        height: p(120),
        alignItems: 'center'
    },
    Text_01:{
        fontSize: p(26),
        color:'#393838',
    },
    Text_06:{
        fontSize: p(26),
        color:'#292929',
    },
    linearGradient: {
        width: WIDTH-p(100),
        height: p(90),
        borderRadius: p(50),
        justifyContent:'center',
        alignItems:'center'
    },
    buttonText:{
        color:'#FFF',
        fontSize: p(30),
        lineHeight: p(60)
    },

});
