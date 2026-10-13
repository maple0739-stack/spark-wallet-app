import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  Platform,
  FlatList,
  DeviceEventEmitter,
  StatusBar,
  RefreshControl,
} from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { Overlay } from 'teaset';
import { Input } from 'react-native-elements';
import Web3 from 'web3';
import Tx from 'ethereumjs-tx';
import { Images } from '../resource/index';
import { CHAIN_LIST, CHAIN_MAP } from '../blockchain/ChainInfo';
import Theme from '../styles/theme';
import {
  getTokenList,
  quote,
  swap,
  updateOrder,
  getTransData,
  isNativeToken,
  toRawAmount,
  fromRawAmount,
  CHAIN_MAP_TO_BRIDGERS,
  CHAIN_MAP_TO_TOKEN_API,
  CHAIN_NAME_CN,
  RECEIVE_CHAIN_TABS,
  BRIDGERS_CONTRACT,
  DONE_STATUS,
  formatStatus,
  isTronChain,
} from '../api/bridgers';

const NATIVE = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

export default class Bridgers extends Component {
  static navigationOptions = () => ({ header: null });

  state = {
    useChainInfo: global.useChainInfo || CHAIN_LIST[defaultBlockChain],
    tokens: [],
    allTokens: [],
    pickerChain: '',
    fromToken: null,
    toToken: null,
    fromAmount: '',
    toAmount: '',
    receiveAddress: '',
    fromBalance: '0',
    toBalance: '0',
    quoteData: null,
    slippage: 0.02,
    priceFlip: false,
    loading: false,
    swapping: false,
    records: [],
    search: '',
    networkSearch: '',
    tokenSide: 'from',
    showTokenPicker: false,
    refreshing: false,
  };

  quoteTimer = null;
  recordTimer = null;

  componentDidMount() {
    this.chainListener = DeviceEventEmitter.addListener('updateUseWallet', () => {
      this.initTokens();
      this.loadRecords();
    });
    this.focusListener = this.props.navigation.addListener('didFocus', () => {
      this.loadRecords();
    });
    this.initTokens();
    this.loadRecords();
    this.startRecordPolling();
  }

  componentWillUnmount() {
    this.chainListener && this.chainListener.remove();
    this.focusListener && this.focusListener.remove();
    this.quoteTimer && clearTimeout(this.quoteTimer);
    this.stopRecordPolling();
  }

  startRecordPolling() {
    this.stopRecordPolling();
    this.recordTimer = setInterval(() => {
      const latest = this.state.records && this.state.records[0];
      if (latest && latest.status && !DONE_STATUS[latest.status]) {
        this.loadRecords();
      }
    }, 8000);
  }

  stopRecordPolling() {
    if (this.recordTimer) {
      clearInterval(this.recordTimer);
      this.recordTimer = null;
    }
  }

  bridgersChain(symbol) {
    return CHAIN_MAP_TO_BRIDGERS[symbol] || symbol;
  }

  displayChainName(chainOrInfo) {
    if (!chainOrInfo) return '';
    if (typeof chainOrInfo === 'string') {
      const info = CHAIN_LIST[chainOrInfo] || CHAIN_LIST[chainOrInfo === 'BSC' ? 'BNB' : chainOrInfo === 'TRON' ? 'TRX' : ''];
      if (info) return info.chainName;
      return CHAIN_NAME_CN[chainOrInfo] || chainOrInfo;
    }
    return chainOrInfo.chainName || chainOrInfo.chainSymbol || '';
  }

  bridgersTokenApiChain(symbol) {
    return CHAIN_MAP_TO_TOKEN_API[symbol] || this.bridgersChain(symbol);
  }

  async initTokens() {
    const useChainInfo = global.useChainInfo || this.state.useChainInfo || CHAIN_LIST[defaultBlockChain];
    this.setState({ useChainInfo, tokens: [], fromToken: null, toToken: null, quoteData: null, toAmount: '', pickerChain: '' });
    try {
      const chain = this.bridgersTokenApiChain(useChainInfo.chainSymbol);
      const fromChain = this.bridgersChain(useChainInfo.chainSymbol);
      const [tokens, allTokens] = await Promise.all([
        getTokenList(chain),
        getTokenList(),
      ]);
      const native = tokens.find((t) => isNativeToken(t.address) || /^(TRX|BNB|ETH)$/i.test(this.symbolShort(t.symbol))) || tokens[0];
      let usdt = tokens.find((t) => /USDT/i.test(t.symbol) && !isNativeToken(t.address));
      if (!usdt && allTokens.length) {
        usdt = allTokens.find((t) => /USDT/i.test(t.symbol) && t.chain !== fromChain) || allTokens.find((t) => /USDT/i.test(t.symbol));
      }
      this.setState({
        tokens,
        allTokens: allTokens.length ? allTokens : tokens,
        fromToken: native,
        toToken: usdt || tokens[1] || tokens[0],
        pickerChain: fromChain,
      }, () => {
        this.loadBalances();
        this.setState({ receiveAddress: '' });
      });
    } catch (e) {
      Toast.info(String(e.message || e).slice(0, 80));
    }
  }

  isSameChain(tokenChain) {
    const cur = this.bridgersChain((this.state.useChainInfo || useChainInfo).chainSymbol);
    const c = String(tokenChain || '').toUpperCase();
    if (c === cur) return true;
    if ((c === 'TRON' || c === 'TRX') && (cur === 'TRON' || cur === 'TRX')) return true;
    return false;
  }

  async getWalletAddressForChain(chain) {
    try {
      const data = await storage.load({ key: 'UseWallet' });
      if (isTronChain(chain)) return data.tronAddress || '';
      return data.address || walletAddress || '';
    } catch (e) {
      return walletAddress || '';
    }
  }

  async syncReceiveAddress(token) {
    const t = token || this.state.toToken;
    if (!t) return;
    const addr = await this.getWalletAddressForChain(t.chain);
    this.setState({ receiveAddress: addr || '' });
  }

  async loadBalances() {
    const { fromToken, toToken } = this.state;
    if (!walletAddress) return;
    if (fromToken) {
      const bal = await this.fetchBalance(fromToken);
      this.setState({ fromBalance: bal });
    }
    if (toToken) {
      if (this.isSameChain(toToken.chain)) {
        const bal = await this.fetchBalance(toToken);
        this.setState({ toBalance: bal });
      } else {
        this.setState({ toBalance: '-' });
      }
    }
  }

  formatBalance(b) {
    const n = parseFloat(b);
    if (!n || isNaN(n)) return '0';
    return n.toFixed(6);
  }

  async fetchBalance(token) {
    try {
      if (useChainInfo.chainSymbol === 'TRX') {
        if (isNativeToken(token.address)) {
          const b = await BlockChainService.getAllBalance(walletAddress, { address: '', decimals: 6 });
          return this.formatBalance(b);
        }
        const b = await BlockChainService.getTrxTokenBalance(walletAddress, token.address, token.decimals);
        return this.formatBalance(b);
      }
      const item = isNativeToken(token.address)
        ? { address: '', decimals: token.decimals || 18 }
        : { address: token.address, decimals: token.decimals };
      const b = await BlockChainService.getAllBalance(walletAddress, item);
      return this.formatBalance(b);
    } catch (e) {
      return '0';
    }
  }

  onFromAmountChange(text) {
    const v = text.replace(/[^0-9.]/g, '');
    this.setState({ fromAmount: v, quoteData: null });
    this.quoteTimer && clearTimeout(this.quoteTimer);
    this.quoteTimer = setTimeout(() => this.doQuote(v), 500);
  }

  async doQuote(amount) {
    const { fromToken, toToken, useChainInfo, slippage } = this.state;
    const amt = amount !== undefined ? amount : this.state.fromAmount;
    if (!fromToken || !toToken || !amt || parseFloat(amt) <= 0) {
      this.setState({ toAmount: '', quoteData: null });
      return;
    }
    try {
      this.setState({ loading: true });
      const fromChain = fromToken.chain || this.bridgersChain(useChainInfo.chainSymbol);
      const toChain = toToken.chain || fromChain;
      const data = await quote({
        fromTokenAddress: fromToken.address || NATIVE,
        toTokenAddress: toToken.address || NATIVE,
        fromTokenAmount: toRawAmount(amt, fromToken.decimals),
        fromTokenChain: fromChain,
        toTokenChain: toChain,
        userAddr: walletAddress,
      });
      let slip = slippage;
      if (data.recommendedSlippage !== undefined && data.recommendedSlippage !== null) {
        const r = parseFloat(data.recommendedSlippage);
        if (!isNaN(r) && r > 0) slip = r < 1 ? r : r / 100;
      }
      let toAmt = data.toTokenAmount;
      if (!toAmt || parseFloat(toAmt) === 0) {
        const rate = parseFloat(data.instantRate || 0);
        toAmt = rate > 0 ? (parseFloat(amt) * rate).toFixed(8).replace(/\.?0+$/, '') : '';
      } else {
        toAmt = String(toAmt);
      }
      this.setState({
        quoteData: data,
        toAmount: toAmt,
        slippage: slip,
        loading: false,
      });
      const minDep = parseFloat(data.depositMin || 0);
      if (minDep && parseFloat(amt) < minDep) {
        Toast.info(lan.t('bridgers.belowMin', { n: minDep }));
      }
    } catch (e) {
      this.setState({ loading: false, toAmount: '', quoteData: null });
      Toast.info(String(e.message || e).slice(0, 80));
    }
  }

  async loadRecords() {
    if (!walletAddress) return;
    try {
      const data = await getTransData({ fromAddress: walletAddress, pageNo: 1, pageSize: 5 });
      this.setState({ records: data.list || [], refreshing: false });
    } catch (e) {
      this.setState({ records: [], refreshing: false });
    }
  }

  onRefreshRecords() {
    this.setState({ refreshing: true });
    this.loadRecords();
    this.loadBalances();
  }

  swapDirection() {
    const { fromToken, toToken, fromBalance, toBalance, fromAmount } = this.state;
    this.setState({
      fromToken: toToken,
      toToken: fromToken,
      fromBalance: toBalance,
      toBalance: fromBalance,
      fromAmount: '',
      toAmount: '',
      quoteData: null,
    }, () => {
      this.setState({ receiveAddress: '' });
      if (fromAmount) this.onFromAmountChange(fromAmount);
    });
  }

  setAll() {
    const { fromBalance } = this.state;
    if (!fromBalance || parseFloat(fromBalance) <= 0) return;
    this.onFromAmountChange(String(fromBalance));
  }

  showChainPull() {
    const overlayView = (
      <Overlay.PullView ref={(v) => (this.overlayChain = v)}>
        <View style={{ width: WIDTH, backgroundColor: '#FFF', paddingBottom: p(40) }}>
          <Text style={styles.sheetTitle}>{lan.t('bridgers.switchNetwork')}</Text>
          {CHAIN_MAP.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.sheetRow}
              onPress={() => this.switchChain(item)}
            >
              <Image style={{ width: p(50), height: p(50), marginRight: p(15) }} source={Images.token[item.chainSymbol]} />
              <Text style={{ color: '#333', fontSize: p(30) }}>{item.chainName}({item.chainSymbol})</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Overlay.PullView>
    );
    Overlay.show(overlayView);
  }

  switchChain(item) {
    this.overlayChain && this.overlayChain.close();
    const chainInfo = CHAIN_LIST[item.chainSymbol];
    global.useChainInfo = chainInfo;
    storage.save({ key: 'UseChain', data: chainInfo });
    storage.load({ key: 'UseWallet' }).then((data) => {
      const addr = chainInfo.chainSymbol === 'TRX' ? data.tronAddress : data.address;
      global.walletAddress = addr;
      global.walletPrivateKey = data.privateKey;
      global.walletPassword = data.password;
      DeviceEventEmitter.emit('setChainInfo', chainInfo);
      DeviceEventEmitter.emit('updateUseWallet');
      this.setState({ useChainInfo: chainInfo }, () => this.initTokens());
    }).catch(() => {
      DeviceEventEmitter.emit('setChainInfo', chainInfo);
      this.setState({ useChainInfo: chainInfo }, () => this.initTokens());
    });
  }

  showTokenPull(side) {
    const fromChain = this.bridgersChain((this.state.useChainInfo || useChainInfo).chainSymbol);
    this.setState({
      tokenSide: side,
      showTokenPicker: true,
      search: '',
      networkSearch: '',
      pickerChain: side === 'to' ? '' : fromChain,
    });
  }

  selectToken(side, item) {
    if (side === 'from') {
      this.setState({ fromToken: item, fromAmount: '', toAmount: '', quoteData: null, showTokenPicker: false, search: '', networkSearch: '' }, () => {
        this.loadBalances();
      });
    } else {
      this.setState({ toToken: item, toAmount: '', quoteData: null, showTokenPicker: false, search: '', networkSearch: '', receiveAddress: '' }, () => {
        this.loadBalances();
        if (this.state.fromAmount) this.doQuote();
      });
    }
  }

  isTokenSelected(item) {
    const cur = this.state.tokenSide === 'from' ? this.state.fromToken : this.state.toToken;
    if (!cur || !item) return false;
    return cur.address === item.address && String(cur.chain) === String(item.chain);
  }

  filteredTokens() {
    const { tokens, allTokens, search, tokenSide, pickerChain } = this.state;
    let list = tokenSide === 'to' ? (allTokens || tokens || []) : (tokens || []);
    if (tokenSide === 'to' && pickerChain) {
      list = list.filter((t) => {
        const c = String(t.chain || '').toUpperCase();
        const p = String(pickerChain).toUpperCase();
        if (p === 'TRON' || p === 'TRX') return c === 'TRON' || c === 'TRX';
        return c === p;
      });
    }
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter((t) =>
      (t.symbol || '').toLowerCase().indexOf(q) >= 0 ||
      (t.name || '').toLowerCase().indexOf(q) >= 0 ||
      (t.chain || '').toLowerCase().indexOf(q) >= 0
    );
  }

  pickerChainTabs() {
    const { allTokens, networkSearch } = this.state;
    const set = {};
    (allTokens || []).forEach((t) => {
      if (t.chain) set[t.chain] = 1;
    });
    let tabs = RECEIVE_CHAIN_TABS.filter((c) => set[c] || (c === 'TRON' && set.TRX));
    Object.keys(set).forEach((c) => {
      if (tabs.indexOf(c) < 0) tabs.push(c);
    });
    if (networkSearch) {
      const q = networkSearch.toLowerCase();
      tabs = tabs.filter((c) => {
        const name = (CHAIN_NAME_CN[c] || c).toLowerCase();
        return name.indexOf(q) >= 0 || String(c).toLowerCase().indexOf(q) >= 0;
      });
    }
    return tabs;
  }

  getChainIconSource(chain) {
    const c = String(chain || '').toUpperCase();
    const alias = {
      BSC: 'BNB',
      BNB: 'BNB',
      ETH: 'ETH',
      TRON: 'TRX',
      TRX: 'TRX',
      BTC: 'BTC',
      OP: 'OPTIMISM',
      OPTIMISM: 'OPTIMISM',
      POLYGON: 'POLYGON',
      MATIC: 'POLYGON',
      ARBITRUM: 'ARBITRUM',
      ARB: 'ARBITRUM',
      BASE: 'BASE',
      SOLANA: 'SOLANA',
      SOL: 'SOLANA',
      AVALANCHE: 'AVALANCHE',
      AVAXC: 'AVALANCHE',
      AVAX: 'AVALANCHE',
      BCH: 'BCH',
      DOGE: 'DOGE',
      LTC: 'LTC',
      CELO: 'CELO',
      XRP: 'XRP',
      XLAYER: 'XLAYER',
      OKEXCHAIN: 'XLAYER',
      OKC: 'XLAYER',
      OKB: 'OKB',
    };
    const key = alias[c] || c;
    if (Images.token[key]) return Images.token[key];
    if (Images.token[c]) return Images.token[c];
    return null;
  }

  renderTokenIconWithBadge(token, size) {
    const s = size || p(56);
    const badge = p(22);
    return (
      <View style={{ width: s, height: s }}>
        {this.renderTokenIcon(token, s)}
        {token && token.chain ? (
          this.getChainIconSource(token.chain) ? (
            <Image
              style={{
                position: 'absolute',
                right: -p(2),
                bottom: -p(2),
                width: badge,
                height: badge,
                borderRadius: badge / 2,
                borderWidth: 1,
                borderColor: '#FFF',
              }}
              source={this.getChainIconSource(token.chain)}
            />
          ) : (
            <View style={{
              position: 'absolute',
              right: -p(2),
              bottom: -p(2),
              width: badge,
              height: badge,
              borderRadius: badge / 2,
              backgroundColor: '#1868FF',
              borderWidth: 1,
              borderColor: '#FFF',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Text style={{ color: '#FFF', fontSize: p(12), fontWeight: '700' }}>
                {(CHAIN_NAME_CN[token.chain] || token.chain || '?')[0]}
              </Text>
            </View>
          )
        ) : null}
      </View>
    );
  }

  renderReceivePathHeader() {
    const { fromToken, toToken } = this.state;
    return (
      <View style={styles.pathHeader}>
        <View style={styles.pathSide}>
          {this.renderTokenIconWithBadge(fromToken, p(48))}
          <View style={{ marginLeft: p(10) }}>
            <Text style={styles.pathSymbol}>{fromToken ? this.symbolShort(fromToken.symbol) : '--'}</Text>
            <Text style={styles.pathChain}>{fromToken ? (CHAIN_NAME_CN[fromToken.chain] || fromToken.chain) : ''}</Text>
          </View>
        </View>
        <View style={styles.pathArrow}>
          <AntDesign name="arrowright" size={p(24)} color="#999" />
        </View>
        <View style={[styles.pathSide, { justifyContent: 'flex-end' }]}>
          <View style={{ marginRight: p(10), alignItems: 'flex-end' }}>
            <Text style={styles.pathSymbol}>{toToken ? this.symbolShort(toToken.symbol) : '--'}</Text>
            <Text style={styles.pathChain}>{toToken ? (CHAIN_NAME_CN[toToken.chain] || toToken.chain) : ''}</Text>
          </View>
          {this.renderTokenIconWithBadge(toToken, p(48))}
        </View>
        <View style={styles.pathActiveBar} />
      </View>
    );
  }

  renderChainIcon(chain, size) {
    const s = size || p(40);
    const src = this.getChainIconSource(chain);
    if (src) return <Image style={{ width: s, height: s, borderRadius: s / 2 }} source={src} />;
    if (!chain) {
      return (
        <View style={{ width: s, height: s, borderRadius: s / 2, backgroundColor: '#1868FF', alignItems: 'center', justifyContent: 'center' }}>
          <AntDesign name="appstore-o" size={s * 0.45} color="#FFF" />
        </View>
      );
    }
    return (
      <View style={{ width: s, height: s, borderRadius: s / 2, backgroundColor: '#E8EEF5', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#4A5568', fontSize: s * 0.35, fontWeight: '700' }}>{(CHAIN_NAME_CN[chain] || chain)[0]}</Text>
      </View>
    );
  }

  renderReceivePicker() {
    const list = this.filteredTokens();
    const tabs = this.pickerChainTabs();
    const pickerChain = this.state.pickerChain;
    return (
      <View style={styles.pickerMask}>
        <View style={styles.dualSheet}>
          <View style={styles.leftPane}>
            <View style={styles.miniSearch}>
              <AntDesign name="search1" size={p(22)} color="#999" />
              <TextInput
                style={styles.miniSearchInput}
                placeholder={lan.t('bridgers.searchNetwork')}
                placeholderTextColor="#AAA"
                value={this.state.networkSearch}
                onChangeText={(networkSearch) => this.setState({ networkSearch })}
              />
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.netRow, !pickerChain && styles.netRowActive]}
                onPress={() => this.setState({ pickerChain: '' })}
              >
                {this.renderChainIcon('', p(40))}
                <Text style={[styles.netText, !pickerChain && styles.netTextActive]} numberOfLines={1}>{lan.t('bridgers.all')}</Text>
                {!pickerChain ? <AntDesign name="check" size={p(28)} color="#111" /> : <View style={{ width: p(28) }} />}
              </TouchableOpacity>
              {tabs.map((c) => {
                const active = String(pickerChain).toUpperCase() === String(c).toUpperCase() ||
                  (isTronChain(pickerChain) && isTronChain(c));
                return (
                  <TouchableOpacity
                    key={c}
                    style={[styles.netRow, active && styles.netRowActive]}
                    onPress={() => this.setState({ pickerChain: c })}
                  >
                    {this.renderChainIcon(c, p(40))}
                    <Text style={[styles.netText, active && styles.netTextActive]} numberOfLines={1}>
                      {CHAIN_NAME_CN[c] || c}
                    </Text>
                    {active ? <AntDesign name="check" size={p(28)} color="#111" /> : <View style={{ width: p(28) }} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
          <View style={styles.rightPane}>
            <View style={styles.rightTop}>
              <TouchableOpacity onPress={() => this.setState({ showTokenPicker: false })} style={{ padding: p(10) }}>
                <AntDesign name="close" size={p(32)} color="#666" />
              </TouchableOpacity>
            </View>
            {this.renderReceivePathHeader()}
            <View style={[styles.miniSearch, { marginHorizontal: p(20), marginTop: p(16) }]}>
              <AntDesign name="search1" size={p(22)} color="#999" />
              <TextInput
                style={styles.miniSearchInput}
                placeholder={lan.t('bridgers.searchName')}
                placeholderTextColor="#AAA"
                value={this.state.search}
                onChangeText={(search) => this.setState({ search })}
              />
            </View>
            <FlatList
              data={list}
              keyExtractor={(item, i) => (item.chain || '') + (item.address || item.symbol) + i}
              renderItem={({ item }) => {
                const selected = this.isTokenSelected(item);
                return (
                  <TouchableOpacity style={styles.tokenPickRow} onPress={() => this.selectToken('to', item)}>
                    {this.renderTokenIconWithBadge(item, p(56))}
                    <View style={{ flex: 1, marginLeft: p(16) }}>
                      <Text style={{ color: '#111', fontSize: p(28), fontWeight: '600' }}>{item.symbol}</Text>
                      <Text style={{ color: '#999', fontSize: p(22), marginTop: p(4) }}>{CHAIN_NAME_CN[item.chain] || item.chain}</Text>
                    </View>
                    {selected ? <AntDesign name="check" size={p(30)} color="#111" /> : null}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={{ padding: p(60), alignItems: 'center' }}>
                  <Text style={{ color: '#999', fontSize: p(26) }}>{lan.t('bridgers.noToken')}</Text>
                </View>
              }
            />
          </View>
        </View>
      </View>
    );
  }

  renderTokenPicker() {
    if (!this.state.showTokenPicker) return null;
    if (this.state.tokenSide === 'to') return this.renderReceivePicker();
    const list = this.filteredTokens();
    return (
      <View style={styles.pickerMask}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => this.setState({ showTokenPicker: false })} />
        <View style={styles.pickerSheet}>
          <Text style={styles.sheetTitle}>{lan.t('bridgers.selectSendToken')}</Text>
          <View style={styles.searchBox}>
            <AntDesign name="search1" size={p(28)} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder={lan.t('bridgers.searchToken')}
              placeholderTextColor="#AAA"
              value={this.state.search}
              onChangeText={(search) => this.setState({ search })}
            />
          </View>
          <FlatList
            data={list}
            keyExtractor={(item, i) => (item.address || item.symbol) + i}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.sheetRow} onPress={() => this.selectToken('from', item)}>
                {this.renderTokenIconWithBadge(item, p(56))}
                <View style={{ flex: 1, marginLeft: p(16) }}>
                  <Text style={{ color: '#111', fontSize: p(28), fontWeight: '600' }}>{this.symbolShort(item.symbol)}</Text>
                  <Text style={{ color: '#999', fontSize: p(22) }}>{CHAIN_NAME_CN[item.chain] || item.chain}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    );
  }

  symbolShort(symbol) {
    if (!symbol) return '';
    return String(symbol).replace(/\(.*\)$/, '');
  }

  getTokenIcon(token) {
    if (!token) return null;
    const base = this.symbolShort(token.symbol || '').toUpperCase();
    if (!base) return null;
    if (Images.token[base]) return Images.token[base];
    if (base === 'WBNB') return Images.token.BNB;
    if (base === 'USDT') return Images.token.USDT;
    if (base === 'USDC') return Images.token.USDC;
    return null;
  }

  renderTokenIcon(token, size) {
    const s = size || p(56);
    const icon = this.getTokenIcon(token);
    if (icon) {
      return <Image style={{ width: s, height: s, borderRadius: s / 2 }} source={icon} />;
    }
    const letter = (this.symbolShort(token && token.symbol) || '?')[0].toUpperCase();
    return (
      <View style={{
        width: s,
        height: s,
        borderRadius: s / 2,
        backgroundColor: '#E8EEF5',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: '#D0D7DE',
      }}>
        <Text style={{ color: '#4A5568', fontSize: s * 0.4, fontWeight: '700' }}>{letter}</Text>
      </View>
    );
  }

  showSlippageEdit() {
    this.setState({ _slipTemp: String(this.state.slippage * 100) });
    const overlayView = (
      <Overlay.PopView ref={(v) => (this.overlaySlip = v)} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <View style={styles.slipBox}>
          <Text style={{ fontSize: p(30), color: '#333', marginBottom: p(30) }}>{lan.t('bridgers.slippageTitle')}</Text>
          <View style={{ flexDirection: 'row', marginBottom: p(30) }}>
            {[0.5, 1, 2, 3].map((v) => (
              <TouchableOpacity
                key={v}
                style={styles.slipBtn}
                onPress={() => this.setState({ _slipTemp: String(v) })}
              >
                <Text style={{ color: '#333', fontSize: p(26) }}>{v}%</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.slipInput}
            keyboardType="numeric"
            defaultValue={String(this.state.slippage * 100)}
            onChangeText={(t) => this.setState({ _slipTemp: t })}
          />
          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={() => {
              const n = parseFloat(this.state._slipTemp);
              if (isNaN(n) || n < 0 || n > 50) {
                Toast.info(lan.t('bridgers.slippageInvalid'));
                return;
              }
              this.overlaySlip && this.overlaySlip.close();
              this.setState({ slippage: n / 100 }, () => this.doQuote());
            }}
          >
            <Text style={{ color: '#111', fontSize: p(28), fontWeight: '600' }}>{lan.t('all.confirm')}</Text>
          </TouchableOpacity>
        </View>
      </Overlay.PopView>
    );
    Overlay.show(overlayView);
  }

  onSwapPress() {
    const { fromAmount, fromToken, toToken, quoteData, fromBalance } = this.state;
    if (!walletAddress) {
      Toast.info(lan.t('bridgers.createWalletFirst'));
      return;
    }
    if (!fromToken || !toToken) {
      Toast.info(lan.t('bridgers.selectToken'));
      return;
    }
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      Toast.info(lan.t('bridgers.enterAmount'));
      return;
    }
    if (!quoteData) {
      Toast.info(lan.t('bridgers.waitQuote'));
      return;
    }
    const min = parseFloat(quoteData.depositMin || 0);
    const max = parseFloat(quoteData.depositMax || 0);
    const amt = parseFloat(fromAmount);
    if (min && amt < min) {
      Toast.info(lan.t('bridgers.belowMin', { n: min }));
      return;
    }
    if (max && amt > max) {
      Toast.info(lan.t('bridgers.aboveMax', { n: max }));
      return;
    }
    if (parseFloat(fromBalance) < amt) {
      Toast.info(lan.t('bridgers.insufficientBalance'));
      return;
    }
    if (!this.state.receiveAddress || !String(this.state.receiveAddress).trim()) {
      Toast.info(lan.t('bridgers.enterRecvAddress'));
      return;
    }
    this.walletPasswordPull();
  }

  walletPasswordPull() {
    const overlayView = (
      <Overlay.PopView ref={(v) => (this.overlayPwd = v)} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ backgroundColor: Theme.backgroundColor, width: WIDTH - p(150), borderRadius: p(10) }}>
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ alignItems: 'center', justifyContent: 'center', height: p(120) }}>
              <Text style={{ fontSize: p(30), color: '#585757', fontWeight: '500' }}>{lan.t('pay.zhifuqueren')}</Text>
            </View>
            <View style={{ width: WIDTH - p(180) }}>
              <Input
                placeholder={lan.t('pay.qingshurqianbaomima')}
                secureTextEntry
                inputStyle={{ fontSize: p(30), marginLeft: p(20) }}
                inputContainerStyle={{ borderColor: '#E7E7E7', borderWidth: p(1), borderRadius: p(10) }}
                onChangeText={(password) => this.setState({ password })}
              />
            </View>
            <View style={{ height: p(1), width: WIDTH - p(150), backgroundColor: '#E7E7E7', marginTop: p(40) }} />
            <View style={{ width: WIDTH / 2, alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity onPress={() => this.overlayPwd && this.overlayPwd.close()}>
                <Text style={{ color: Theme.cancelColor, fontSize: p(30) }}>{lan.t('all.cancel')}</Text>
              </TouchableOpacity>
              <View style={{ height: p(100), width: p(1), backgroundColor: '#E7E7E7' }} />
              <TouchableOpacity onPress={() => this.confirmSwap()}>
                <Text style={{ color: Theme.appColor, fontSize: p(30) }}>{lan.t('all.confirm')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Overlay.PopView>
    );
    Overlay.show(overlayView);
  }

  async confirmSwap() {
    const { password, useChainInfo } = this.state;
    if (password !== walletPassword) {
      Toast.info(lan.t('wallet.passwordError'));
      return;
    }
    this.overlayPwd && this.overlayPwd.close();
    if (useChainInfo.chainSymbol === 'TRX') {
      Toast.info(lan.t('bridgers.tronNotSupport'));
      return;
    }
    await this.execEvmSwap();
  }

  async ensureApprove(token, spender, amountHuman) {
    if (isNativeToken(token.address)) return true;
    const allow = await BlockChainService.getAllowance(token.address, spender);
    if (parseFloat(allow) >= parseFloat(amountHuman)) return true;
    Loading.show(lan.t('bridgers.approving'));
    const data = BlockChainService.getApproveData(token.address, spender);
    const gwei = useChainInfo.chainSymbol === 'BNB' ? (global.BnbGwei || 3) : (global.EthGwei || 10);
    const hash = await BlockChainService.sigTransactionBroadcast(token.address, data, 120000, gwei, 0);
    Loading.hide();
    if (!hash) {
      Toast.info(lan.t('bridgers.approveFail'));
      return false;
    }
    Toast.success(lan.t('bridgers.approveSuccess'));
    await new Promise((r) => setTimeout(r, 3000));
    return true;
  }

  async broadcastRaw(to, data, valueHex) {
    const chainId = Number(useChainInfo.chainId);
    const rpc = useChainInfo.chainUrl;
    const chainWeb3 = new Web3(new Web3.providers.HttpProvider(rpc));
    const gwei = useChainInfo.chainSymbol === 'BNB' ? (global.BnbGwei || 3) : (global.EthGwei || 10);
    return new Promise((resolve) => {
      chainWeb3.eth.getTransactionCount(walletAddress, (err, nonce) => {
        try {
          const gasPrice = gwei * Math.pow(10, 9);
          let valueBN = 0;
          if (valueHex) {
            valueBN = chainWeb3.toBigNumber(valueHex);
          }
          const transaction = {
            chainId,
            nonce,
            gasPrice: chainWeb3.toHex(gasPrice),
            gasLimit: chainWeb3.toHex(800000),
            to,
            value: chainWeb3.toHex(valueBN),
            data: data || '0x',
          };
          let pk = walletPrivateKey || '';
          if (pk.substring(0, 2) === '0x') pk = pk.substring(2);
          const tx = new Tx(transaction);
          tx.sign(new Buffer(pk, 'hex'));
          const raw = '0x' + tx.serialize().toString('hex');
          chainWeb3.eth.sendRawTransaction(raw, (e2, hash) => {
            resolve(e2 ? '' : hash);
          });
        } catch (e) {
          resolve('');
        }
      });
    });
  }

  async execEvmSwap() {
    const { fromToken, toToken, fromAmount, quoteData, slippage, useChainInfo } = this.state;
    try {
      this.setState({ swapping: true });
      Loading.show(lan.t('bridgers.swapping'));
      const fromChain = fromToken.chain || this.bridgersChain(useChainInfo.chainSymbol);
      const toChain = toToken.chain || fromChain;
      const fromAddress = await this.getWalletAddressForChain(fromChain);
      const toAddress = String(this.state.receiveAddress || '').trim();
      if (!fromAddress || !toAddress) {
        Loading.hide();
        this.setState({ swapping: false });
        Toast.info(lan.t('bridgers.emptyRecvAddress'));
        return;
      }
      const contract = quoteData.contractAddress || BRIDGERS_CONTRACT[fromChain];
      const ok = await this.ensureApprove(fromToken, contract, fromAmount);
      if (!ok) {
        this.setState({ swapping: false });
        Loading.hide();
        return;
      }
      const txData = await swap({
        fromTokenAddress: fromToken.address || NATIVE,
        toTokenAddress: toToken.address || NATIVE,
        fromTokenAmount: quoteData.fromTokenAmount || toRawAmount(fromAmount, fromToken.decimals),
        amountOutMin: quoteData.amountOutMin,
        fromTokenChain: fromChain,
        toTokenChain: toChain,
        fromAddress,
        toAddress,
        fromCoinCode: fromToken.symbol,
        toCoinCode: toToken.symbol,
        slippage: String(slippage),
      });
      const hash = await this.broadcastRaw(txData.to, txData.data, txData.value);
      if (!hash) {
        Loading.hide();
        this.setState({ swapping: false });
        Toast.info(lan.t('bridgers.swapFail'));
        return;
      }
      try {
        await updateOrder({
          hash,
          fromTokenAddress: fromToken.address || NATIVE,
          toTokenAddress: toToken.address || NATIVE,
          fromAddress,
          toAddress,
          fromTokenChain: fromChain,
          toTokenChain: toChain,
          fromTokenAmount: quoteData.fromTokenAmount || toRawAmount(fromAmount, fromToken.decimals),
          amountOutMin: quoteData.amountOutMin,
          fromCoinCode: fromToken.symbol,
          toCoinCode: toToken.symbol,
          slippage: String(slippage),
        });
      } catch (e) {}
      Loading.hide();
      this.setState({ swapping: false, fromAmount: '', toAmount: '', quoteData: null });
      Toast.success(lan.t('bridgers.submitSuccess'));
      this.loadBalances();
      this.loadRecords();
    } catch (e) {
      Loading.hide();
      this.setState({ swapping: false });
      Toast.info(String(e.message || e).slice(0, 100));
    }
  }

  getRateText() {
    const { quoteData, fromToken, toToken, priceFlip, fromAmount, toAmount } = this.state;
    if (!quoteData || !fromToken || !toToken) return '--';
    const a = this.symbolShort(fromToken.symbol);
    const b = this.symbolShort(toToken.symbol);
    let rate = parseFloat(quoteData.instantRate || 0);
    if (!rate && fromAmount && toAmount && parseFloat(fromAmount) > 0) {
      rate = parseFloat(toAmount) / parseFloat(fromAmount);
    }
    if (!rate) return '--';
    if (priceFlip) {
      return '1' + b + '≈' + (1 / rate).toFixed(6) + a;
    }
    return '1' + a + '≈' + rate.toFixed(6) + b;
  }

  getMinReceive() {
    const { quoteData, toToken, slippage, toAmount } = this.state;
    if (!toToken) return '--';
    let human = 0;
    if (quoteData && quoteData.amountOutMin && parseFloat(quoteData.amountOutMin) > 0) {
      human = parseFloat(fromRawAmount(quoteData.amountOutMin, toToken.decimals || 18));
    } else if (toAmount && parseFloat(toAmount) > 0) {
      human = parseFloat(toAmount);
    } else {
      return '--';
    }
    const min = human * (1 - (slippage || 0));
    return min.toFixed(6) + ' ' + this.symbolShort(toToken.symbol);
  }

  getRangeText() {
    const { quoteData, fromToken } = this.state;
    if (!quoteData || !fromToken) return '--';
    const min = quoteData.depositMin;
    const max = quoteData.depositMax;
    if (min === undefined || max === undefined || min === null || max === null) return '--';
    const sym = this.symbolShort(fromToken.symbol);
    return min + ' ~ ' + max + ' ' + sym;
  }

  showMoreRecords() {
    this.props.navigation.push('BridgersRecord');
  }

  renderRecord(item) {
    const fromToken = { symbol: item.fromCoinCode, chain: item.fromChain };
    const toToken = { symbol: item.toCoinCode, chain: item.toChain };
    return (
      <View style={styles.recordItem} key={item.orderId || item.id}>
        <View style={styles.recordTop}>
          <Text style={styles.recordTime}>{item.createTime || '--'}</Text>
          <Text style={styles.recordStatus}>{formatStatus(item.status)}</Text>
        </View>
        <View style={styles.recordBody}>
          <View style={styles.recordSide}>
            {this.renderTokenIconWithBadge(fromToken, p(48))}
            <View style={{ marginLeft: p(12) }}>
              <Text style={styles.recordSymbol}>{item.fromCoinCode || '--'}</Text>
              <Text style={styles.recordAmt}>{item.fromTokenAmount || '0'}</Text>
            </View>
          </View>
          <View style={styles.recordArrow}>
            <AntDesign name="arrowright" size={p(22)} color="#999" />
          </View>
          <View style={[styles.recordSide, { justifyContent: 'flex-end' }]}>
            <View style={{ marginRight: p(12), alignItems: 'flex-end' }}>
              <Text style={styles.recordSymbol}>{item.toCoinCode || '--'}</Text>
              <Text style={styles.recordAmt}>{item.toTokenAmount || '0'}</Text>
            </View>
            {this.renderTokenIconWithBadge(toToken, p(48))}
          </View>
        </View>
      </View>
    );
  }

  renderTokenSide(side) {
    const isFrom = side === 'from';
    const token = isFrom ? this.state.fromToken : this.state.toToken;
    const bal = isFrom ? this.state.fromBalance : this.state.toBalance;
    const amount = isFrom ? this.state.fromAmount : this.state.toAmount;
    const chain = token ? (CHAIN_NAME_CN[token.chain] || token.chain) : '';
    return (
      <View style={styles.sideBox}>
        <View style={styles.sideHead}>
          <Text style={styles.sideLabel}>{isFrom ? lan.t('bridgers.send') : lan.t('bridgers.receiveEst')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <AntDesign name="wallet" size={p(24)} color="#999" />
            <Text style={{ color: '#666', fontSize: p(24), marginLeft: p(8) }}>{bal || '0'}</Text>
            {isFrom ? (
              <TouchableOpacity onPress={() => this.setAll()} style={{ marginLeft: p(12) }}>
                <Text style={{ color: '#1868FF', fontSize: p(24) }}>{lan.t('bridgers.all')}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
        <View style={styles.tokenRow}>
          <TouchableOpacity style={styles.tokenSelect} onPress={() => this.showTokenPull(side)}>
            {this.renderTokenIconWithBadge(token, p(56))}
            <View style={{ marginLeft: p(12) }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: '#111', fontSize: p(32), fontWeight: '700' }}>
                  {token ? this.symbolShort(token.symbol) : lan.t('bridgers.choose')}
                </Text>
                <AntDesign name="caretdown" size={p(18)} color="#666" style={{ marginLeft: p(8) }} />
              </View>
              <Text style={{ color: '#999', fontSize: p(22) }}>{chain}</Text>
            </View>
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            {isFrom ? (
              <TextInput
                style={styles.amountInput}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#CCC"
                value={amount}
                onChangeText={(t) => this.onFromAmountChange(t)}
              />
            ) : (
              <Text style={styles.amountInput}>{amount || '0'}</Text>
            )}
          </View>
        </View>
        {isFrom ? (
          <Text style={styles.rangeHint} numberOfLines={1}>{this.getRangeText()}</Text>
        ) : null}
      </View>
    );
  }

  render() {
    const { useChainInfo, quoteData, slippage, loading, records, swapping } = this.state;
    const latest = records && records[0];
    return (
      <View style={{ flex: 1, backgroundColor: '#F5F6F8' }}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <View style={styles.header}>
          <TouchableOpacity style={styles.chainPill} onPress={() => this.showChainPull()}>
            {useChainInfo && Images.token[useChainInfo.chainSymbol] ? (
              <Image style={{ width: p(36), height: p(36), marginRight: p(8) }} source={Images.token[useChainInfo.chainSymbol]} />
            ) : null}
            <Text style={styles.chainPillText} numberOfLines={1} ellipsizeMode="tail">
              {useChainInfo && useChainInfo.chainName}
            </Text>
            <AntDesign name="caretdown" size={p(16)} color="#666" style={{ marginLeft: p(6) }} />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={() => this.props.navigation.push('ManageWallet')}>
            <Image style={{ width: p(56), height: p(56) }} source={require('../resource/image/nana/ico6.png')} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={this.state.refreshing} onRefresh={() => this.onRefreshRecords()} />
          }
        >
          <View style={styles.card}>
            <View style={styles.cardTools}>
              <TouchableOpacity onPress={() => this.doQuote()} style={{ marginRight: p(24) }}>
                <AntDesign name="reload1" size={p(32)} color={loading ? '#1868FF' : '#999'} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => this.showSlippageEdit()}>
                <AntDesign name="setting" size={p(32)} color="#999" />
              </TouchableOpacity>
            </View>

            {this.renderTokenSide('from')}

            <TouchableOpacity style={styles.swapBtn} onPress={() => this.swapDirection()}>
              <Image
                style={styles.swapIcon}
                source={require('../resource/image/spark/qiehuan.png')}
                resizeMode="contain"
              />
            </TouchableOpacity>

            {this.renderTokenSide('to')}

            <View style={styles.addrBox}>
              <View style={styles.addrHead}>
                <Text style={styles.addrLabel}>{lan.t('bridgers.recvAddress')}</Text>
                <TouchableOpacity onPress={() => this.syncReceiveAddress()}>
                  <Text style={{ color: '#1868FF', fontSize: p(24) }}>{lan.t('bridgers.useWallet')}</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.addrInput}
                placeholder={lan.t('bridgers.enterRecvAddressPh')}
                placeholderTextColor="#AAA"
                value={this.state.receiveAddress}
                autoCapitalize="none"
                autoCorrect={false}
                multiline
                textAlignVertical="top"
                onChangeText={(receiveAddress) => this.setState({ receiveAddress })}
              />
            </View>

            <TouchableOpacity
              style={[styles.exchangeBtn, (loading || swapping) && { opacity: 0.6 }]}
              disabled={loading || swapping}
              onPress={() => this.onSwapPress()}
            >
              <Text style={styles.exchangeText}>{loading ? lan.t('bridgers.quoting') : swapping ? lan.t('bridgers.swapping') : lan.t('bridgers.swap')}</Text>
            </TouchableOpacity>

            <View style={styles.infoList}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{lan.t('bridgers.price')}</Text>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => this.setState({ priceFlip: !this.state.priceFlip })}>
                  <Text style={styles.infoVal}>{this.getRateText()}</Text>
                  <AntDesign name="swap" size={p(22)} color="#1868FF" style={{ marginLeft: p(8) }} />
                </TouchableOpacity>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{lan.t('bridgers.minReceive')}</Text>
                <Text style={styles.infoVal}>{this.getMinReceive()}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{lan.t('bridgers.slippage')}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.infoVal}>{(slippage * 100).toFixed(slippage * 100 < 1 ? 2 : 0)}%</Text>
                  <View style={styles.mevBadge}>
                    <Text style={{ color: '#1868FF', fontSize: p(20) }}>{lan.t('bridgers.mevProtect')}</Text>
                  </View>
                  <TouchableOpacity onPress={() => this.showSlippageEdit()}>
                    <AntDesign name="edit" size={p(24)} color="#999" style={{ marginLeft: p(10) }} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{lan.t('bridgers.priceImpact')}</Text>
                <Text style={[styles.infoVal, { color: '#25ba8b' }]}>
                  {quoteData && quoteData.fee ? '~' + (quoteData.fee * 100).toFixed(2) + '%' : '~0%'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.historyHead}>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => this.onRefreshRecords()}>
              <Text style={{ color: '#111', fontSize: p(28), fontWeight: '600' }}>{lan.t('bridgers.latestRecord')}</Text>
              <AntDesign name="reload1" size={p(26)} color="#999" style={{ marginLeft: p(12) }} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => this.showMoreRecords()}>
              <Text style={{ color: '#1868FF', fontSize: p(26) }}>{lan.t('bridgers.moreRecords')}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.historyBox}>
            {latest ? this.renderRecord(latest) : (
              <View style={styles.emptyBox}>
                <AntDesign name="filetext1" size={p(60)} color="#DDD" />
                <Text style={{ color: '#999', fontSize: p(26), marginTop: p(16) }}>{lan.t('bridgers.noRecord')}</Text>
              </View>
            )}
          </View>
          <View style={{ height: p(40) }} />
        </ScrollView>
        {this.renderTokenPicker()}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  header: {
    marginTop: Platform.OS === 'ios' ? p(90) : p(70),
    paddingHorizontal: p(30),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chainPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: p(16),
    paddingVertical: p(10),
    borderRadius: p(40),
    maxWidth: WIDTH - p(160),
    flexShrink: 1,
  },
  chainPillText: {
    color: '#111',
    fontSize: p(24),
    flexShrink: 1,
  },
  card: {
    marginTop: p(30),
    marginHorizontal: p(24),
    backgroundColor: '#FFF',
    borderRadius: p(24),
    padding: p(28),
  },
  cardTools: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: p(10),
  },
  sideBox: {
    marginTop: p(10),
  },
  sideHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: p(16),
  },
  sideLabel: {
    color: '#666',
    fontSize: p(26),
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F8FA',
    borderRadius: p(16),
    padding: p(20),
  },
  tokenSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '55%',
  },
  tokenLogo: {
    width: p(56),
    height: p(56),
    borderRadius: p(28),
  },
  amountInput: {
    fontSize: p(40),
    color: '#111',
    fontWeight: '600',
    textAlign: 'right',
    minWidth: p(160),
    padding: 0,
  },
  rangeHint: {
    color: '#999',
    fontSize: p(20),
    marginTop: p(10),
    textAlign: 'right',
    alignSelf: 'flex-end',
    maxWidth: WIDTH - p(100),
  },
  swapBtn: {
    width: p(70),
    height: p(70),
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: p(4),
    zIndex: 2,
  },
  swapIcon: {
    width: p(35),
    height: p(50),
    resizeMode: 'contain',
  },
  addrBox: {
    marginTop: p(20),
  },
  addrHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: p(12),
  },
  addrLabel: {
    color: '#666',
    fontSize: p(26),
  },
  addrInput: {
    backgroundColor: '#F7F8FA',
    borderRadius: p(14),
    paddingHorizontal: p(20),
    paddingVertical: p(18),
    fontSize: p(24),
    color: '#111',
    minHeight: p(110),
    lineHeight: p(34),
  },
  exchangeBtn: {
    marginTop: p(28),
    height: p(90),
    borderRadius: p(45),
    backgroundColor: '#FFD24C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exchangeText: {
    color: '#111',
    fontSize: p(32),
    fontWeight: '700',
  },
  infoList: {
    marginTop: p(24),
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: p(18),
  },
  infoLabel: {
    color: '#999',
    fontSize: p(24),
  },
  infoVal: {
    color: '#333',
    fontSize: p(24),
  },
  mevBadge: {
    marginLeft: p(10),
    backgroundColor: '#E8F0FF',
    paddingHorizontal: p(10),
    paddingVertical: p(4),
    borderRadius: p(8),
  },
  historyBox: {
    marginTop: p(16),
    marginHorizontal: p(24),
    backgroundColor: '#FFF',
    borderRadius: p(24),
    padding: p(28),
    minHeight: p(180),
  },
  historyHead: {
    marginTop: p(30),
    marginHorizontal: p(30),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyBox: {
    height: p(180),
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordItem: {
    paddingTop: p(4),
  },
  recordTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: p(18),
  },
  recordTime: {
    color: '#111',
    fontSize: p(24),
  },
  recordStatus: {
    color: '#1868FF',
    fontSize: p(24),
  },
  recordBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recordSide: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordSymbol: {
    color: '#111',
    fontSize: p(26),
    fontWeight: '600',
  },
  recordAmt: {
    color: '#999',
    fontSize: p(22),
    marginTop: p(4),
  },
  recordArrow: {
    width: p(40),
    height: p(40),
    borderRadius: p(20),
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: p(8),
  },
  sheetTitle: {
    textAlign: 'center',
    fontSize: p(30),
    color: '#333',
    marginVertical: p(30),
    fontWeight: '600',
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: p(30),
    paddingVertical: p(22),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: p(30),
    marginBottom: p(16),
    backgroundColor: '#F5F6F8',
    borderRadius: p(12),
    paddingHorizontal: p(20),
    height: p(70),
  },
  chainTabs: {
    maxHeight: p(70),
    marginBottom: p(10),
  },
  chainTab: {
    paddingHorizontal: p(22),
    paddingVertical: p(12),
    borderRadius: p(30),
    backgroundColor: '#F5F6F8',
    marginRight: p(12),
  },
  chainTabActive: {
    backgroundColor: '#E8F0FF',
  },
  chainTabText: {
    color: '#666',
    fontSize: p(24),
  },
  chainTabTextActive: {
    color: '#1868FF',
    fontWeight: '600',
  },
  searchInput: {
    flex: 1,
    marginLeft: p(12),
    fontSize: p(26),
    color: '#333',
    padding: 0,
  },
  slipBox: {
    backgroundColor: '#FFF',
    width: WIDTH - p(100),
    borderRadius: p(16),
    padding: p(40),
    alignItems: 'center',
  },
  slipBtn: {
    paddingHorizontal: p(22),
    paddingVertical: p(12),
    borderRadius: p(10),
    backgroundColor: '#F5F6F8',
    marginHorizontal: p(8),
  },
  slipBtnActive: {
    backgroundColor: '#E8F0FF',
  },
  slipInput: {
    width: '100%',
    height: p(80),
    borderWidth: 1,
    borderColor: '#E7E7E7',
    borderRadius: p(12),
    paddingHorizontal: p(20),
    fontSize: p(30),
    marginBottom: p(30),
  },
  confirmBtn: {
    width: '100%',
    height: p(80),
    borderRadius: p(40),
    backgroundColor: '#FFD24C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerMask: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  dualSheet: {
    width: WIDTH,
    height: HEIGHT * 0.78,
    backgroundColor: '#FFF',
    borderTopLeftRadius: p(24),
    borderTopRightRadius: p(24),
    flexDirection: 'row',
    overflow: 'hidden',
  },
  leftPane: {
    width: WIDTH * 0.34,
    backgroundColor: '#F7F8FA',
    paddingTop: p(20),
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#E8E8E8',
  },
  rightPane: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  rightTop: {
    alignItems: 'flex-end',
    paddingHorizontal: p(16),
    paddingTop: p(10),
  },
  miniSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: p(12),
    marginBottom: p(12),
    backgroundColor: '#FFF',
    borderRadius: p(10),
    paddingHorizontal: p(12),
    height: p(56),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5E5',
  },
  miniSearchInput: {
    flex: 1,
    marginLeft: p(8),
    fontSize: p(22),
    color: '#333',
    padding: 0,
  },
  netRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: p(14),
    paddingVertical: p(18),
  },
  netRowActive: {
    backgroundColor: '#FFF',
  },
  netText: {
    flex: 1,
    marginLeft: p(10),
    color: '#666',
    fontSize: p(24),
  },
  netTextActive: {
    color: '#111',
    fontWeight: '600',
  },
  pathHeader: {
    marginHorizontal: p(20),
    paddingBottom: p(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEE',
    position: 'relative',
  },
  pathSide: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pathSymbol: {
    color: '#111',
    fontSize: p(26),
    fontWeight: '700',
  },
  pathChain: {
    color: '#999',
    fontSize: p(20),
    marginTop: p(2),
  },
  pathArrow: {
    width: p(40),
    height: p(40),
    borderRadius: p(20),
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: p(6),
  },
  pathActiveBar: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: '42%',
    height: p(4),
    backgroundColor: '#1868FF',
    borderRadius: p(2),
  },
  tokenPickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: p(20),
    paddingVertical: p(20),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  pickerSheet: {
    width: WIDTH,
    height: HEIGHT * 0.7,
    backgroundColor: '#FFF',
    borderTopLeftRadius: p(24),
    borderTopRightRadius: p(24),
  },
});
