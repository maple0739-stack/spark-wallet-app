/**
 * Created by zh on 2019/08/08.
 * 我的页面
 * my page
 */
import React, { Component } from 'react';
import {
    View, Image, Clipboard, StyleSheet, Text, TouchableOpacity, ScrollView
} from 'react-native';
import AntDesign from "react-native-vector-icons/AntDesign";

import Web3 from "web3";
import {Images} from "../../resource";
import {Head} from "../../common/Head";

const web3 = new Web3();
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const WITHDRAWAL_TOPIC = '0x7fcf532c15f0a6db0bd6d0e038bea71d30d808c7d98cb3bf7268a95bf5081b65';
const WBNB = '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c';
const PANCAKE_ROUTERS = {
    '0x10ed43c718714eb63d5aa57b78b54704e256024e': 1,
    '0x1b81d678ffb9c0263b24a97847620c99d213eb14': 1,
    '0x13f4ea83d0bd40e75c8222255bc855a974568dd4': 1,
    '0x1a0a18ac4becddbd6389559687d1a73d8927e416': 1,
    '0xd9c500dff816a1da21a48a732d3498bf09dc9aeb': 1,
};
const KNOWN_TOKENS = {
    '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c': {symbol: 'BNB', decimals: 18},
    '0x55d398326f99059ff775485246999027b3197955': {symbol: 'USDT', decimals: 18},
    '0x48846a4083ec1b021d55d2b6200a8d9cd86e655e': {symbol: 'FH', decimals: 18},
    '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d': {symbol: 'USDC', decimals: 18},
    '0xe9e7cea3dedca5984780bafc599bd69add087d56': {symbol: 'BUSD', decimals: 18},
};

function rpc(method, params){
    return fetch(useChainInfo.chainUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({jsonrpc: '2.0', id: 1, method: method, params: params}),
    }).then(function (res) { return res.json(); }).then(function (json) { return json.result; });
}

function topicAddress(topic){
    if(!topic || topic.length < 40) return '';
    return ('0x' + topic.slice(-40)).toLowerCase();
}

function decodePath(input){
    if(!input || input.length < 10) return [];
    const data = input.slice(10);
    const words = [];
    for(let i = 0; i + 64 <= data.length; i += 64){
        words.push(data.slice(i, i + 64));
    }
    for(let i = 0; i < words.length; i++){
        const off = parseInt(words[i], 16);
        if(!off || off % 32 !== 0) continue;
        const idx = off / 32;
        if(idx >= words.length) continue;
        const len = parseInt(words[idx], 16);
        if(len < 2 || len > 6 || idx + 1 + len > words.length) continue;
        const addrs = [];
        let ok = true;
        for(let j = 0; j < len; j++){
            const word = words[idx + 1 + j];
            if(word.slice(0, 24) !== '000000000000000000000000'){
                ok = false;
                break;
            }
            addrs.push('0x' + word.slice(24));
        }
        if(ok) return addrs.map(function (a) { return a.toLowerCase(); });
    }
    return [];
}

function sumLog(logs, topic, token, who, index){
    let sum = web3.toBigNumber(0);
    (logs || []).forEach(function (log) {
        if(!log.topics || (log.topics[0] || '').toLowerCase() !== topic) return;
        if(token && (log.address || '').toLowerCase() !== token) return;
        if(topicAddress(log.topics[index]) !== who) return;
        sum = sum.plus(web3.toBigNumber(log.data || '0x0'));
    });
    return sum;
}

function formatUnits(raw, decimals){
    const d = decimals == null || isNaN(Number(decimals)) ? 18 : Number(decimals);
    const base = web3.toBigNumber(10).pow(d);
    const bn = web3.toBigNumber(raw || 0);
    const whole = bn.dividedBy(base).floor();
    let frac = bn.modulo(base).toString(10);
    frac = Array(Math.max(d - frac.length, 0) + 1).join('0') + frac;
    frac = frac.slice(0, 12).replace(/0+$/, '');
    return frac ? whole.toString(10) + '.' + frac : whole.toString(10);
}

function shortAddr(addr){
    return addr.slice(0, 6) + '...' + addr.slice(-4);
}

function readString(hex){
    if(!hex || hex === '0x') return '';
    const h = hex.slice(2);
    try{
        if(h.length <= 64){
            return web3.toUtf8(hex).replace(/\u0000/g, '').trim();
        }
        const len = parseInt(h.slice(64, 128), 16);
        if(!len || len > 32) return '';
        return web3.toUtf8('0x' + h.slice(128, 128 + len * 2)).trim();
    }catch (e) {
        return '';
    }
}
export default class TransferDetails extends Component {
  constructor(props) {
    super(props);
  }
    static navigationOptions = {
        header: null
    };
  state = {
      transferData:{
          from:'0x0000000000000000000000000000000000000000',
          to:'0x0000000000000000000000000000000000000000',
          value:0,
          gasPrice:0,
          gasUsed:0,
          hash:'0x0000000000000000000000000000000000000000000000000000000000000000000000000000000',
          contractAddress:'',
          tokenSymbol:'',
          tokenDecimal:1,
          isError:0
      },
      swapInfo: null,
  }
  componentDidMount() {
      const { params } = this.props.navigation.state;
      this.setState({
          transferData:params.item
      });
      this.loadSwap(params.item);
  }
  loadSwap(item){
      const to = String(item.to || item.contractAddress || '').toLowerCase();
      if(!PANCAKE_ROUTERS[to] || !item.hash || !useChainInfo || !useChainInfo.chainUrl) return;
      const user = String(item.from || walletAddress || '').toLowerCase();
      Promise.all([
          rpc('eth_getTransactionByHash', [item.hash]),
          rpc('eth_getTransactionReceipt', [item.hash]),
      ]).then((res) => {
          const tx = res[0] || {};
          const receipt = res[1] || {};
          const logs = receipt.logs || [];
          let path = decodePath(tx.input);
          const value = web3.toBigNumber(tx.value || '0x0');
          if(!path.length){
              const spent = {};
              const got = {};
              logs.forEach((log) => {
                  if(!log.topics || (log.topics[0] || '').toLowerCase() !== TRANSFER_TOPIC) return;
                  const token = (log.address || '').toLowerCase();
                  const from = topicAddress(log.topics[1]);
                  const dest = topicAddress(log.topics[2]);
                  if(from === user) spent[token] = 1;
                  if(dest === user) got[token] = 1;
              });
              const head = value.gt(0) ? [WBNB] : Object.keys(spent);
              const tail = Object.keys(got);
              path = head.concat(tail.filter(function (a) { return head.indexOf(a) < 0; }));
          }
          if(path.length < 2) return null;
          return this.resolveTokens(path).then((meta) => {
              const first = path[0];
              const last = path[path.length - 1];
              let payRaw = sumLog(logs, TRANSFER_TOPIC, first, user, 1);
              if(first === WBNB && value.gt(0)) payRaw = value;
              let gotRaw = sumLog(logs, TRANSFER_TOPIC, last, user, 2);
              if(last === WBNB && gotRaw.eq(0)) gotRaw = sumLog(logs, WITHDRAWAL_TOPIC, '', user, 1);
              this.setState({
                  swapInfo: {
                      fromSymbol: meta[first].symbol,
                      toSymbol: meta[last].symbol,
                      fromAmount: formatUnits(payRaw, meta[first].decimals),
                      toAmount: formatUnits(gotRaw, meta[last].decimals),
                  }
              });
          });
      }).catch(function () {});
  }
  resolveTokens(path){
      const uniq = [];
      path.forEach(function (addr) {
          if(uniq.indexOf(addr) < 0) uniq.push(addr);
      });
      return Promise.all(uniq.map((addr) => {
          if(KNOWN_TOKENS[addr]) return Promise.resolve(KNOWN_TOKENS[addr]);
          return Promise.all([
              rpc('eth_call', [{to: addr, data: '0x95d89b41'}, 'latest']),
              rpc('eth_call', [{to: addr, data: '0x313ce567'}, 'latest']),
          ]).then(function (res) {
              const symbol = readString(res[0]) || shortAddr(addr);
              const decimals = parseInt(res[1] || '0x12', 16);
              return {symbol: symbol, decimals: isNaN(decimals) ? 18 : decimals};
          }).catch(function () {
              return {symbol: shortAddr(addr), decimals: 18};
          });
      })).then(function (list) {
          const meta = {};
          uniq.forEach(function (addr, i) { meta[addr] = list[i]; });
          return meta;
      });
  }
    copyData(data){
        Toast.success('复制成功');
        Clipboard.setString(data);
    }
    tokenIcon(symbol){
        const src = Images.token[symbol];
        if(!src) return <View style={styles.routeIcon}/>;
        return <Image source={src} style={styles.routeIcon}/>;
    }
  render() {
    const {transferData, swapInfo} = this.state;
      let address = transferData.from;
      let type = 1;//收入
      if(address.toUpperCase() == walletAddress.toUpperCase()){
          type = 2;//支出
      }
      let toAddress = transferData.to?transferData.to:transferData.contractAddress;
      const isTrx = useChainInfo && useChainInfo.chainSymbol === 'TRX';
      const mainDec = isTrx ? 6 : 18;
      let dec;
      if(transferData.input == "0x662fac39"){
          dec = 18;
      }else if(transferData.contractAddress){
          dec = parseFloat(transferData.tokenDecimal);
      }else{
          dec = transferData.tokenDecimal != null && transferData.tokenDecimal !== ''
              ? parseFloat(transferData.tokenDecimal) : mainDec;
      }
      const amount = formatUnits(transferData.value, dec);
      let time = utils.FormatDateTime(transferData.timeStamp);
      let gasFee = formatUnits(
          web3.toBigNumber(transferData.gasPrice || 0).times(transferData.gasUsed || 0).toString(10),
          mainDec
      );
      let isError = transferData.isError;
    return (
        <View style={{flex:1,backgroundColor:'#FFFFFF'}}>

            <Head text={lan.t('nana.jiaoyixiangqing')} leftOnPress={() => this.props.navigation.goBack()} />

            <ScrollView style={{flex:1}} contentContainerStyle={{alignItems:'center',paddingTop:p(100),paddingBottom:p(80)}}>
                <View style={{width:WIDTH-p(50),backgroundColor:'#F4F5F7',borderRadius: p(10)}}>
                    <View style={{justifyContent:'center',alignItems:'center',top:-p(40)}}>
                        <AntDesign
                            name={isError==1?'closecircle':'checkcircle'}
                            size={40}
                            color={type==1?'#c59405':'#131313'}
                        />
                        <Text style={{color:type==1?'#c59405':'#131313',fontSize:p(26),fontWeight: '500',marginTop:p(10)}}>
                            {isError==1? lan.t('nana.jiaoyishibai'):lan.t('nana.jiaoyichenggong')}
                        </Text>
                        {swapInfo ? (
                            <View style={styles.routeBox}>
                                <View style={styles.routeSide}>
                                    {this.tokenIcon(swapInfo.fromSymbol)}
                                    <View>
                                        <Text style={styles.routeName}>{swapInfo.fromSymbol}(BSC)</Text>
                                        <Text style={styles.routeAmt}>{swapInfo.fromAmount}</Text>
                                    </View>
                                </View>
                                <AntDesign name="arrowright" size={18} color="#C8C8C8" />
                                <View style={[styles.routeSide, {justifyContent: 'flex-end'}]}>
                                    <View style={{alignItems: 'flex-end'}}>
                                        <Text style={styles.routeName}>{swapInfo.toSymbol}(BSC)</Text>
                                        <Text style={styles.routeAmt}>{swapInfo.toAmount}</Text>
                                    </View>
                                    {this.tokenIcon(swapInfo.toSymbol)}
                                </View>
                            </View>
                        ) : (
                            <Text style={{color:type==1?'#c59405':'#131313',fontSize:p(32),fontWeight: '500',marginTop:p(50),marginBottom: p(50)}}>
                                {type==1?'+':'-'} {amount} {transferData.contractAddress?transferData.tokenSymbol:useChainInfo.chainSymbol}
                            </Text>
                        )}

                        <View style={styles.ViewSty}>
                            <Text style={styles.TextSty}>
                                {lan.t('nana.zhuanchudizhi')}
                            </Text>
                            <View style={styles.ViewSty1}>
                                <Text style={styles.TextSty1}>
                                    {transferData && transferData.from.substring(0,16)}...{transferData && transferData.from.substring(26)}
                                </Text>
                                <TouchableOpacity onPress={()=>this.copyData(transferData.from)}>
                                    <AntDesign
                                        name='copy1'
                                        size={20}
                                        color={'#6b6969'}
                                        style={{marginLeft:p(10)}}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={styles.ViewSty}>
                            <Text style={styles.TextSty}>
                                {lan.t('nana.jieshoudizhi')}
                            </Text>
                            <View style={styles.ViewSty1}>
                                <Text style={styles.TextSty1}>
                                    {transferData && toAddress.substring(0,16)}...{transferData && toAddress.substring(26)}
                                </Text>
                                <TouchableOpacity onPress={()=>this.copyData(toAddress)}>
                                    <AntDesign
                                        name='copy1'
                                        size={20}
                                        color={'#6b6969'}
                                        style={{marginLeft:p(10)}}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={{flexDirection: 'row',justifyContent: 'space-between',width:WIDTH-p(100)}}>
                            <View>
                                <View style={styles.ViewSty2}>
                                    <Text style={styles.TextSty}>
                                        {lan.t('nana.kuanggongfeiyong')}
                                    </Text>
                                    <View style={styles.ViewSty1}>
                                        <Text style={styles.TextSty1}>
                                            {gasFee} {useChainInfo.chainSymbol}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.ViewSty2}>
                                    <Text style={styles.TextSty}>
                                        {lan.t('nana.qukuaigaodu')}
                                    </Text>
                                    <View style={styles.ViewSty1}>
                                        <Text style={styles.TextSty1}>
                                            {transferData.blockNumber}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.ViewSty2}>
                                    <Text style={styles.TextSty}>
                                        {lan.t('nana.jiaoyishijian')}
                                    </Text>
                                    <View style={styles.ViewSty1}>
                                        <Text style={styles.TextSty1}>
                                            {time}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            <TouchableOpacity
                                onPress={()=>this.props.navigation.push('Browser',{browserUrl: isTrx
                                    ? ('https://tronscan.org/#/transaction/'+transferData.hash)
                                    : (useChainInfo.browserUrl+'/tx/'+transferData.hash)})}
                                style={{justifyContent: 'center',alignItems: 'center',marginTop: p(50)}}>
                                <Image style={styles.Image_01} source={Images.token[useChainInfo.chainSymbol]}/>
                                <Text style={{fontSize:p(26),color:'#454444',marginTop: p(10)}}>
                                    {lan.t('nana.liulanqichaxu')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <View style={[styles.ViewSty,{borderBottomColor: '#FFF'}]}>
                            <Text style={styles.TextSty}>
                                {lan.t('nana.jiaoyihaxi')}
                            </Text>
                            <View style={[styles.ViewSty1,{width:WIDTH-p(180)}]}>
                                <Text style={styles.TextSty1}>
                                    {transferData.hash}
                                </Text>
                                <TouchableOpacity onPress={()=>this.copyData(transferData.hash)}>
                                    <AntDesign
                                        name='copy1'
                                        size={20}
                                        color={'#6b6969'}
                                        style={{marginLeft:p(50)}}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                </View>

            </ScrollView>
        </View>
    );
  }
}

const styles = StyleSheet.create({
    Image_01:{
        width:p(80),
        height:p(80),
    },
    routeBox:{
        flexDirection:'row',
        alignItems:'center',
        width:WIDTH-p(90),
        backgroundColor:'#FFFFFF',
        borderRadius:p(16),
        paddingVertical:p(24),
        paddingHorizontal:p(20),
        marginTop:p(36),
        marginBottom:p(20),
    },
    routeSide:{
        flex:1,
        flexDirection:'row',
        alignItems:'center',
    },
    routeIcon:{
        width:p(56),
        height:p(56),
        borderRadius:p(28),
        marginHorizontal:p(10),
        backgroundColor:'#F4F5F7',
    },
    routeName:{
        color:'#131313',
        fontSize:p(28),
        fontWeight:'600',
    },
    routeAmt:{
        color:'#8A8A8A',
        fontSize:p(24),
        marginTop:p(6),
    },
    TextSty1:{
        color:'#222121',
        fontSize:p(26),
        fontWeight: '500'
    },
    ViewSty1:{
        flexDirection: 'row',
        alignItems:'center',
        marginTop:p(10),
        justifyContent:'space-between'
    },
    TextSty:{color:'#4e4d4d',fontSize:p(26)},
    ViewSty:{
        height:p(120),
        justifyContent:'center',
        width:WIDTH-(50),
    },
    ViewSty2:{
        height:p(120),
        justifyContent:'center',
        borderBottomWidth: p(1),
        borderBottomColor: '#F5F8FA',
    },
})
