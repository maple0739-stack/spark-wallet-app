/**
 * Created by zh on 2019/08/08.
 * 我的页面
 * my page
 */
import React, { Component } from 'react';
import {
  View, Image, ScrollView, StyleSheet, Text, TouchableOpacity,
  Clipboard, Platform,
} from "react-native";
import AntDesign from "react-native-vector-icons/AntDesign";
import Ionicons from "react-native-vector-icons/Ionicons";
import {Images} from "../../resource";
import {fetchExplorerTxList, fetchExplorerTokenTx} from "./explorerAccountApi";
import {Head} from "../../common/Head";
import {fetchFhTicker} from "../../api/fhMarket";

function formatTokenAmount(raw, decimals){
    const dec = parseInt(decimals, 10);
    const d = isNaN(dec) ? 18 : dec;
    let s = String(raw == null ? '0' : raw).trim();
    if(!/^\d+$/.test(s)){
        const n = Number(s);
        if(!isFinite(n)) return '0';
        s = Math.round(n).toLocaleString('fullwide', {useGrouping: false});
    }
    s = s.replace(/^0+/, '') || '0';
    if(s === '0') return '0';
    let text;
    if(s.length <= d){
        text = '0.' + (Array(d - s.length + 1).join('0') + s);
    }else{
        const whole = s.slice(0, s.length - d);
        const frac = s.slice(s.length - d);
        text = frac ? whole + '.' + frac : whole;
    }
    if(text.indexOf('.') >= 0){
        const parts = text.split('.');
        const frac = parts[1].slice(0, 12).replace(/0+$/, '');
        text = frac ? parts[0] + '.' + frac : parts[0];
    }
    return text || '0';
}

export default class TransferRecord extends Component {
  constructor(props) {
    super(props);
  }
    static navigationOptions = {
        header: null
    };
  state = {
      recordData:[],
      tokenData:[],
      tokenInfo:null,
      useChainInfo:null,
      tabIndex:0,
      marketPrice:null,
      priceChange:null,
  }
  componentDidMount() {
      const { params } = this.props.navigation.state;
      this.setState({
          tokenInfo:params.item,
          useChainInfo:params.useChainInfo
      })
      this.getTokenRecord(params.useChainInfo,params.item);
      this.getAllRecord(params.useChainInfo);
      this.fetchMarket(params.item);
  }
  fetchMarket(tokenInfo){
      if(!tokenInfo) return;
      const cached = global[tokenInfo.symbol+"_Price"];
      if(cached != null && cached !== '' && !isNaN(parseFloat(cached))){
          this.setState({marketPrice: parseFloat(cached)});
      }
      if(tokenInfo.symbol === 'USDT' || tokenInfo.symbol === 'USDC'){
          this.setState({marketPrice:1, priceChange:0});
          return;
      }
      if(tokenInfo.symbol === 'FH' && tokenInfo.address){
          this.fetchAveMarket(tokenInfo);
          return;
      }
      const symbol = tokenInfo.price || (tokenInfo.symbol + 'USDT');
      if(!symbol){
          this.setState({marketPrice:1, priceChange:0});
          return;
      }
      fetch('https://data-api.binance.vision/api/v3/ticker/24hr?symbol='+symbol)
          .then(r=>r.json())
          .then(res=>{
              if(res && res.lastPrice){
                  this.setState({
                      marketPrice: parseFloat(parseFloat(res.lastPrice).toFixed(2)),
                      priceChange: parseFloat(res.priceChangePercent),
                  });
              }
          }).catch(()=>{})
  }
  applyMarketPrice(symbol, price, change24h){
      const n = parseFloat(price);
      if(!isFinite(n)) return;
      if(symbol) global[symbol+"_Price"] = n;
      const next = {marketPrice: n};
      if(change24h != null && !isNaN(change24h)) next.priceChange = change24h;
      this.setState(next);
  }
  fetchAveMarket(tokenInfo){
      fetchFhTicker().then((data) => {
          if(data && data.price != null && !isNaN(data.price)){
              const change = data.change24h != null && !isNaN(data.change24h) ? data.change24h : 0;
              this.applyMarketPrice(tokenInfo.symbol, data.price, change);
              return;
          }
          this.fetchRouterMarket(tokenInfo);
      });
  }
  canOpenKLine(){
      const {tokenInfo} = this.state;
      if(!tokenInfo || !isKline) return false;
      if(tokenInfo.symbol === 'FH' && tokenInfo.address) return true;
      return !!tokenInfo.price;
  }
  openKLine(){
      const {tokenInfo, priceChange} = this.state;
      if(!this.canOpenKLine()) return;
      const priceUsd = this.getPrice();
      if(tokenInfo.symbol === 'FH' && tokenInfo.address){
          this.props.navigation.push('KLine', {
              symbol: tokenInfo.symbol,
              address: tokenInfo.address,
              platform: 'bsc',
              priceUsd: priceUsd,
              changePercent24Hr: priceChange,
          });
          return;
      }
      const pair = String(tokenInfo.price);
      const symbol = pair.replace(/USDT$/i, '') || tokenInfo.symbol;
      this.props.navigation.push('KLine', {
          symbol: symbol,
          priceUsd: priceUsd,
          changePercent24Hr: priceChange,
      });
  }
  fetchRouterMarket(tokenInfo){
      if(!tokenInfo || !tokenInfo.address || !tokenInfo.router) return;
      BlockChainService.getTokenPrice(tokenInfo.address, tokenInfo.router).then((res) => {
          if(res == null || isNaN(parseFloat(res))) return;
          this.applyMarketPrice(tokenInfo.symbol, res, null);
      });
  }
  getTokenRecord(useChainInfo,tokenInfo){
      if(!tokenInfo || !tokenInfo.address) return;
      const decimals = tokenInfo.decimals != null ? String(tokenInfo.decimals) : '18';
      fetchExplorerTokenTx(
          useChainInfo.chainId,
          walletAddress,
          tokenInfo.address,
          1,
          50,
          {symbol: tokenInfo.symbol || '', decimals: decimals}
      ).then((res) => {
          console.log('tokenTx', res);
          if(res && res.ok){
              this.setState({tokenData: res.list || []})
          }
      })
  }
  getAllRecord(useChainInfo){
      const chain = useChainInfo || this.state.useChainInfo;
      if(!chain) return;
      console.log('getAllRecord', chain.chainId, walletAddress);
      fetchExplorerTxList(chain.chainId, walletAddress, 1, 50).then((res) => {
          console.log('txList', res);
          if(res && res.ok){
              this.setState({recordData: res.list || []})
          }
      })
  }
  copyAddress(address){
      Clipboard.setString(address);
      Toast.success(lan.t('all.copyAddress'));
  }
  shortTokenAddress(address){
      if(!address) return '';
      if(address.length <= 12) return address;
      return address.substring(0,6)+'...'+address.substring(address.length-6);
  }
  getBalance(){
      const {tokenInfo, useChainInfo} = this.state;
      if(!tokenInfo || !useChainInfo) return '0.0000';
      const key = useChainInfo.chainSymbol+"_"+walletAddress+"_"+tokenInfo.symbol;
      return global[key] || this.state[key] || '0.0000';
  }
  getPrice(){
      const {tokenInfo, marketPrice} = this.state;
      if(marketPrice != null) return marketPrice;
      if(!tokenInfo) return null;
      return global[tokenInfo.symbol+"_Price"] || this.state[tokenInfo.symbol+"_Price"] || null;
  }
  getUsdValue(){
      const bal = parseFloat(this.getBalance());
      const price = parseFloat(this.getPrice());
      if(!isFinite(bal) || !isFinite(price)) return null;
      return (bal * price).toFixed(2);
  }
  isMainToken(){
      const {tokenInfo, useChainInfo} = this.state;
      return !!(tokenInfo && useChainInfo && tokenInfo.symbol == useChainInfo.chainSymbol);
  }
  isZeroValue(value){
      if(value == null || value === '') return true;
      const s = String(value).trim();
      if(s === '0' || s === '0x' || s === '0x0') return true;
      if(/^0x0+$/i.test(s)) return true;
      const n = Number(s);
      return !isNaN(n) && n === 0;
  }
  isContractCall(item){
      if(!this.isMainToken()) return false;
      const input = String(item.input || '');
      const hasInput = input.length > 2 && input.toLowerCase() !== '0x';
      return hasInput || this.isZeroValue(item.value);
  }
  getDirection(item){
      const me = String(walletAddress || '').toUpperCase();
      const from = String(item.from || '').toUpperCase();
      const to = String(item.to || '').toUpperCase();
      if(to === me && from !== me) return 'in';
      if(from === me) return 'out';
      if(to === me) return 'in';
      return 'out';
  }
  getListData(){
      const {tokenInfo, useChainInfo, recordData, tokenData, tabIndex} = this.state;
      if(!tokenInfo || !useChainInfo) return [];
      let list = this.isMainToken() ? (recordData || []) : (tokenData || []);
      if(tabIndex === 1){
          list = list.filter(item => {
              if(this.getDirection(item) !== 'in') return false;
              if(this.isContractCall(item)) return false;
              return !this.isZeroValue(item.value);
          });
      }else if(tabIndex === 2){
          list = list.filter(item => this.getDirection(item) === 'out');
      }
      return list;
  }
  getTypeLabel(item, direction){
      const to = String(item.to || item.contractAddress || '').toLowerCase();
      const pancakeRouters = {
          '0x10ed43c718714eb63d5aa57b78b54704e256024e': 1,
          '0x1b81d678ffb9c0263b24a97847620c99d213eb14': 1,
          '0x13f4ea83d0bd40e75c8222255bc855a974568dd4': 1,
          '0x1a0a18ac4becddbd6389559687d1a73d8927e416': 1,
          '0xd9c500dff816a1da21a48a732d3498bf09dc9aeb': 1,
      };
      if(pancakeRouters[to]) return 'PancakeSwap';
      if(this.isContractCall(item)) return lan.t('news.heyuediaoyong');
      if(this.isMainToken()) return lan.t('news.zhubizhuanzhang');
      return direction === 'in' ? lan.t('news.zhuanru') : lan.t('news.zhuanchu');
  }
  getAmount(item){
      const {tokenInfo} = this.state;
      const mainDec = tokenInfo && tokenInfo.decimals != null ? tokenInfo.decimals : 18;
      if(this.isMainToken()){
          return formatTokenAmount(item.value, mainDec);
      }
      if(item.input == "0x662fac39"){
          return formatTokenAmount(item.value, 18);
      }
      const dec = item.tokenDecimal != null ? item.tokenDecimal : (tokenInfo.decimals || 18);
      return formatTokenAmount(item.value, dec);
  }
  renderItem(item, index){
      const {tokenInfo} = this.state;
      const direction = this.getDirection(item);
      let address = direction === 'out'
          ? (item.to || item.contractAddress || item.from || '')
          : (item.from || '');
      if(!address) address = '';
      const shortAddr = address.length > 12
          ? address.substring(0,6)+'...'+address.substring(address.length-6)
          : address;
      const amount = this.getAmount(item);
      const time = utils.FormatDateTime(item.timeStamp);
      const isContract = this.isContractCall(item);
      const typeLabel = this.getTypeLabel(item, direction);
      const symbol = tokenInfo.symbol;
      let amountText = amount + ' ' + symbol;
      let amountColor = '#1f1e1e';
      if(isContract){
          amountText = '0 ' + symbol;
          amountColor = '#1f1e1e';
      }else if(direction === 'in'){
          amountText = '+' + amount + ' ' + symbol;
          amountColor = '#c59405';
      }else{
          amountText = '-' + amount + ' ' + symbol;
          amountColor = '#131313';
      }
      return (
          <TouchableOpacity
              onPress={()=>this.props.navigation.push('TransferDetails',{item:item})}
              key={index} style={styles.ViewSty}>
              <View style={{flexDirection: 'row', alignItems: 'center', flex:1}}>
                  {
                      isContract ?
                          <View style={[styles.typeIcon,{backgroundColor:'#131313'}]}>
                              <AntDesign name="arrowup" size={18} color="#fff"/>
                          </View>
                          : direction === 'in' ?
                          <View style={[styles.typeIcon,{backgroundColor:'#c59405'}]}>
                              <AntDesign name="arrowdown" size={18} color="#fff"/>
                          </View>
                          :
                          <View style={[styles.typeIcon,{backgroundColor:'#131313'}]}>
                              <AntDesign name="arrowup" size={18} color="#fff"/>
                          </View>
                  }
                  <View style={{marginLeft: p(20), flex:1}}>
                      <View style={{flexDirection:'row',alignItems:'center'}}>
                          <Text style={{fontSize: p(28), color: '#1f1e1e'}} numberOfLines={1}>
                              {shortAddr}
                          </Text>
                      </View>
                      <Text style={{fontSize: p(24), color: '#8a8a8a', marginTop: p(8)}}>
                          {typeLabel}
                      </Text>
                  </View>
              </View>
              <View style={{alignItems:'flex-end', marginLeft:p(10)}}>
                  <Text style={{fontSize: p(26), color: amountColor, fontWeight: '500'}}>
                      {amountText}
                  </Text>
                  <Text style={{fontSize: p(22), color: '#8a8a8a', marginTop: p(8)}}>
                      {time}
                  </Text>
              </View>
          </TouchableOpacity>
      )
  }
  render() {
    const {tokenInfo, tabIndex, priceChange} = this.state;
    const list = this.getListData();
    const price = this.getPrice();
    const usd = this.getUsdValue();
    const tabs = [lan.t('news.quanbu'), lan.t('news.zhuanru'), lan.t('news.zhuanchu')];
    const changeNum = priceChange != null ? priceChange : null;
    const changeUp = changeNum != null && changeNum >= 0;
    return (
        <View style={{flex:1,backgroundColor:'#F5F6F8'}}>

            <Head text={lan.t('news.jiaoyijilu')} leftOnPress={() => this.props.navigation.goBack()} />

            <View style={styles.assetRow}>
                <View style={{flexDirection: 'row',alignItems:'center',flex:1}}>
                    {
                        Images.token[tokenInfo && tokenInfo.symbol]?
                            <Image resizeMode="stretch" style={{ width:p(56), height:p(56), borderRadius:p(28)}}
                                   source={Images.token[tokenInfo && tokenInfo.symbol]}/>
                                   :
                            <View style={{height:p(56),width:p(56),borderRadius:p(100),
                                backgroundColor: '#929191',justifyContent:'center',alignItems:'center'}}>
                                <Text style={{fontSize:p(18),color:'#ffffff'}}>
                                    {tokenInfo && tokenInfo.symbol}
                                </Text>
                            </View>
                    }
                    <View style={{marginLeft:p(16), flex:1}}>
                        <Text style={{fontSize: p(34),color: '#242424',fontWeight:'700'}}>
                            {tokenInfo && tokenInfo.symbol}
                        </Text>
                        {tokenInfo && tokenInfo.address ?
                            <TouchableOpacity
                                onPress={()=>this.copyAddress(tokenInfo.address)}
                                style={{flexDirection:'row', alignItems:'center', marginTop:p(6)}}
                                hitSlop={{top:8, bottom:8, left:4, right:8}}>
                                <Text style={{fontSize:p(22), color:'#8a8a8a'}} numberOfLines={1}>
                                    {this.shortTokenAddress(tokenInfo.address)}
                                </Text>
                                <AntDesign name="copy1" size={p(22)} color="#8a8a8a" style={{marginLeft:p(8)}} />
                            </TouchableOpacity>
                            : null}
                    </View>
                </View>
                <View style={{alignItems:'flex-end'}}>
                    <Text style={{fontSize: p(36),color: '#242424',fontWeight:'700'}}>
                        {this.getBalance()}
                    </Text>
                    <Text style={{fontSize: p(24),color: '#9a9a9a',marginTop:p(6)}}>
                        {usd != null ? ('≈ $'+usd) : '≈ $--'}
                    </Text>
                </View>
            </View>

            <TouchableOpacity
                style={styles.priceBar}
                activeOpacity={this.canOpenKLine() ? 0.75 : 1}
                onPress={()=>this.openKLine()}>
                <Text style={{fontSize:p(28),color:'#242424'}}>{lan.t('news.shichangjiage')}</Text>
                <View style={{flexDirection:'row',alignItems:'center'}}>
                    <View style={{alignItems:'flex-end',marginRight:p(16)}}>
                        <Text style={{fontSize:p(28),color:'#242424',fontWeight:'600'}}>
                            {price != null ? Number(price).toFixed(2) : '--'}
                        </Text>
                        <Text style={{fontSize:p(22),color:'#9a9a9a',marginTop:p(4)}}>
                            {price != null ? ('$'+Number(price).toFixed(2)) : '$--'}
                        </Text>
                    </View>
                    {changeNum != null ?
                        <View style={[styles.changeBadge,{backgroundColor: changeUp ? '#2ebd85' : '#D90606'}]}>
                            <Text style={{fontSize:p(22),color:'#fff',fontWeight:'600'}}>
                                {(changeUp?'+':'')+changeNum.toFixed(2)+'%'}
                            </Text>
                        </View>
                        : null}
                </View>
            </TouchableOpacity>

            <View style={styles.tabRow}>
                <View style={{flexDirection:'row',alignItems:'center',flex:1}}>
                    {tabs.map((t, i)=>(
                        <TouchableOpacity key={i} onPress={()=>this.setState({tabIndex:i})} style={styles.tabItem}>
                            <Text style={{fontSize:p(28),color: tabIndex===i?'#242424':'#8a8a8a',fontWeight:tabIndex===i?'600':'400'}}>
                                {t}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <ScrollView style={{flex:1}}>
                <View style={{alignItems:'center'}}>
                    {list.map((item, index) => this.renderItem(item, index))}
                </View>
            </ScrollView>

            <View style={styles.bottomBar}>
                <TouchableOpacity
                    onPress={()=>this.props.navigation.push('Receive')}
                    style={[styles.TouchableSty,{backgroundColor: '#efb405',marginRight:p(20)}]}>
                    <Text style={styles.TextSty4}>
                        {lan.t('news.shoukuan')}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={()=>this.props.navigation.push('Transfer',
                        {item:this.state.tokenInfo,useChainInfo:this.state.useChainInfo})}
                    style={[styles.TouchableSty,{backgroundColor: '#131313'}]}>
                    <Text style={styles.TextSty4}>
                        {lan.t('news.zhuanzhuang')}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
  }
}

const styles = StyleSheet.create({
    header:{
        flexDirection:'row',
        marginTop: Platform.OS === 'ios'?p(85):p(55),
        alignItems:'center',
        paddingHorizontal:p(20),
        height:p(70),
    },
    headerSide:{
        width:p(60),
        height:p(55),
        justifyContent:'center',
        alignItems:'center',
    },
    headerTitle:{
        flex:1,
        textAlign:'center',
        fontSize:p(32),
        color:'#242424',
        fontWeight:'600',
    },
    assetRow:{
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'space-between',
        marginHorizontal:p(30),
        marginTop:p(24),
    },
    priceBar:{
        marginHorizontal:p(30),
        marginTop:p(24),
        backgroundColor:'#FFFFFF',
        borderRadius:p(24),
        minHeight:p(100),
        paddingHorizontal:p(28),
        paddingVertical:p(22),
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'space-between',
    },
    changeBadge:{
        paddingHorizontal:p(14),
        paddingVertical:p(8),
        borderRadius:p(10),
        minWidth:p(100),
        alignItems:'center',
        marginLeft: p(10)
    },
    tabRow:{
        flexDirection:'row',
        alignItems:'center',
        marginTop:p(28),
        paddingHorizontal:p(30),
        marginBottom:p(8),
    },
    tabItem:{
        marginRight:p(40),
        alignItems:'center',
    },
    typeIcon:{
        width:p(55),
        height:p(55),
        borderRadius:p(28),
        justifyContent:'center',
        alignItems:'center',
    },
    bottomBar:{
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'center',
        paddingHorizontal:p(30),
        paddingBottom: Platform.OS === 'ios'?p(40):p(20),
        paddingTop:p(16),
    },
    TextSty4:{
        color: '#FFFFFF',
        fontWeight:'500',
        fontSize:p(30),
        marginLeft:p(10)
    },
    TouchableSty:{
        height: p(80),
        flex:1,
        borderRadius:p(50),
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
    },
    ViewSty:{
        width:WIDTH-p(30),
        flexDirection:'row',
        justifyContent:'space-between',
        alignItems:'center',
        height: p(125),
        borderBottomWidth:StyleSheet.hairlineWidth,
        borderBottomColor:'#e7e5e5'
    },
})
