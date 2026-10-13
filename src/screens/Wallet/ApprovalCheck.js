import React, { Component } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Clipboard,
  ActivityIndicator,
  Image,
  RefreshControl,
  StatusBar,
} from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Overlay } from 'teaset';
import { Input as RnInput } from 'react-native-elements';
import { Head } from '../../common/Head';
import { Images } from '../../resource';
import { fetchGoplusErc20TokenApprovals } from './goplusTokenApproval';
import * as BlockChainService from '../../blockchain/BlockChainService';

function shortAddr(addr) {
  if (!addr || addr.length < 12) return addr || '-';
  return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
}

function formatUtc(ts) {
  if (!ts) return '-';
  const d = new Date(Number(ts) * 1000);
  const pad = (n) => (n < 10 ? '0' + n : '' + n);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} (UTC)`;
}

function isUnlimited(amount) {
  if (!amount) return false;
  const s = String(amount).toLowerCase();
  if (s === 'unlimited' || s === '無限' || s === '无限') return true;
  if (/^0x[f]+$/i.test(s)) return true;
  if (/^\d+$/.test(s) && s.length >= 60) return true;
  return false;
}

function formatAmount(amount, decimals, symbol) {
  if (isUnlimited(amount)) return { text: `${lan.t('approval.unlimited')} ${symbol || ''}`.trim(), warn: true };
  try {
    const dec = decimals != null ? Number(decimals) : 18;
    const raw = String(amount || '0');
    if (!/^\d+$/.test(raw)) return { text: `${raw} ${symbol || ''}`, warn: false };
    if (raw.length <= dec) {
      const frac = raw.padStart(dec, '0').replace(/0+$/, '');
      return { text: `0${frac ? '.' + frac : ''} ${symbol || ''}`.trim(), warn: false };
    }
    const intPart = raw.slice(0, raw.length - dec);
    const fracPart = raw.slice(raw.length - dec).replace(/0+$/, '');
    return { text: `${intPart}${fracPart ? '.' + fracPart : ''} ${symbol || ''}`.trim(), warn: false };
  } catch (e) {
    return { text: `${amount} ${symbol || ''}`, warn: false };
  }
}

function tokenRiskLabel(group) {
  const bad =
    group.malicious_address === 1 ||
    (group.malicious_behavior && group.malicious_behavior.length > 0);
  if (bad) return { ok: false, text: lan.t('approval.riskBad') };
  return { ok: true, text: lan.t('approval.riskOk') };
}

export default class ApprovalCheck extends Component {
  static navigationOptions = { header: null };

  state = {
    loading: true,
    refreshing: false,
    list: [],
    error: '',
    password: '',
    revokingKey: '',
  };

  componentDidMount() {
    this.loadList();
  }

  getChainAndAddr() {
    const params = (this.props.navigation.state && this.props.navigation.state.params) || {};
    const chain = params.useChainInfo || global.useChainInfo;
    const addr = params.walletAddress || global.walletAddress;
    return { chain, addr };
  }

  loadList = (isRefresh) => {
    const { chain, addr } = this.getChainAndAddr();
    if (!chain || chain.chainSymbol === 'TRX') {
      this.setState({ loading: false, refreshing: false, error: lan.t('approval.chainNotSupport'), list: [] });
      return;
    }
    if (!addr) {
      this.setState({ loading: false, refreshing: false, error: lan.t('approval.noAddress'), list: [] });
      return;
    }
    this.setState(isRefresh ? { refreshing: true } : { loading: true, error: '' });
    fetchGoplusErc20TokenApprovals(chain.chainId, addr).then((res) => {
      if (res.ok) {
        this.setState({ list: res.list || [], loading: false, refreshing: false, error: '' });
      } else {
        this.setState({ list: [], loading: false, refreshing: false, error: res.error || lan.t('approval.loadFail') });
      }
    });
  };

  copyText = (text) => {
    if (!text) return;
    Clipboard.setString(text);
    Toast.success(lan.t('all.copyAddress'));
  };

  confirmRevoke = (group, item, idx) => {
    const { chain } = this.getChainAndAddr();
    if (!chain || chain.chainSymbol === 'TRX') {
      Toast.info(lan.t('approval.chainNotSupportShort'));
      return;
    }
    this.setState({ password: '' });
    const key = `${group.token_address}_${item.approved_contract}_${idx}`;
    const overlayView = (
      <Overlay.PopView
        ref={(v) => (this.pwdOverlay = v)}
        style={{ alignItems: 'center', justifyContent: 'center' }}
      >
        <View style={{ backgroundColor: '#FFF', width: WIDTH - p(150), borderRadius: p(16), paddingBottom: p(20) }}>
          <View style={{ alignItems: 'center', justifyContent: 'center', height: p(120) }}>
            <Text style={{ fontSize: p(30), color: '#585757', fontWeight: '500' }}>{lan.t('approval.revokeConfirm')}</Text>
          </View>
          <View style={{ width: WIDTH - p(180), alignSelf: 'center' }}>
            <RnInput
              placeholder={lan.t('pay.qingshurqianbaomima')}
              placeholderTextColor="#999"
              secureTextEntry
              inputStyle={{ fontSize: p(30), marginLeft: p(20), color: '#131313' }}
              inputContainerStyle={{ borderColor: '#E7E7E7', borderWidth: p(1), borderRadius: p(10) }}
              onChangeText={(password) => this.setState({ password })}
            />
          </View>
          <Text style={{ color: '#925e5e', fontSize: p(22), marginTop: p(10), marginHorizontal: p(30) }}>
            {lan.t('approval.revokeGasTip')}
          </Text>
          <View style={{ height: p(1), width: WIDTH - p(150), backgroundColor: '#E7E7E7', marginTop: p(40) }} />
          <View style={{ width: WIDTH / 2, alignSelf: 'center', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => this.pwdOverlay && this.pwdOverlay.close()}>
              <Text style={{ color: '#cf4545', fontSize: p(30) }}>{lan.t('all.cancel')}</Text>
            </TouchableOpacity>
            <View style={{ height: p(100), width: p(1), backgroundColor: '#E7E7E7' }} />
            <TouchableOpacity onPress={() => this.doRevoke(group, item, key)}>
              <Text style={{ color: Theme.appColor, fontSize: p(30) }}>{lan.t('all.confirm')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Overlay.PopView>
    );
    Overlay.show(overlayView);
  };

  doRevoke = (group, item, key) => {
    const { password } = this.state;
    if (password !== walletPassword) {
      Toast.info(lan.t('wallet.passwordError'));
      return;
    }
    this.pwdOverlay && this.pwdOverlay.close();
    const token = group.token_address;
    const spender = item.approved_contract;
    if (!token || !spender) {
      Toast.info(lan.t('approval.missingParams'));
      return;
    }
    this.setState({ revokingKey: key });
    Loading.show();
    try {
      const data = BlockChainService.getRevokeApproveData(token, spender);
      const chain = (this.getChainAndAddr().chain) || useChainInfo;
      const gwei = chain.chainSymbol === 'ETH' ? (EthGwei || 10) : (BnbGwei || 1);
      BlockChainService.sigTransactionBroadcast(token, data, 90000, gwei, 0).then((hash) => {
        Loading.hide();
        this.setState({ revokingKey: '' });
        if (hash) {
          Toast.success(lan.t('approval.revokeSubmitted'));
          setTimeout(() => this.loadList(true), 2000);
        } else {
          Toast.info(lan.t('approval.revokeFail'));
        }
      });
    } catch (e) {
      Loading.hide();
      this.setState({ revokingKey: '' });
      Toast.info(e.message || lan.t('approval.revokeFail'));
    }
  };

  renderApproval(group, item, idx) {
    const symbol = group.token_symbol || '';
    const amt = formatAmount(item.approved_amount, group.decimals, symbol);
    const info = item.address_info || {};
    const notContract = info.is_contract === 0;
    const key = `${group.token_address}_${item.approved_contract}_${idx}`;
    return (
      <View key={key} style={styles.innerCard}>
        <View style={styles.rowBetween}>
          <Text style={styles.label}>{lan.t('approval.approveContract', { n: idx + 1 })}</Text>
          <TouchableOpacity style={styles.row} onPress={() => this.copyText(item.approved_contract)}>
            <Text style={styles.mono}>{shortAddr(item.approved_contract)}</Text>
            <AntDesign name="copy1" size={14} color="#999" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>
        {notContract ? (
          <View style={styles.warnTag}>
            <Text style={styles.warnTagText}>{lan.t('approval.notContract')}</Text>
          </View>
        ) : null}
        {info.contract_name || info.tag ? (
          <Text style={[styles.sub, { marginTop: p(8) }]}>{info.contract_name || info.tag}</Text>
        ) : null}
        <Text style={[styles.label, { marginTop: p(20) }]}>{lan.t('approval.lastChangeTime')}</Text>
        <Text style={styles.value}>{formatUtc(item.approved_time)}</Text>
        <Text style={[styles.label, { marginTop: p(16) }]}>{lan.t('approval.txHash')}</Text>
        <TouchableOpacity style={styles.row} onPress={() => this.copyText(item.hash)}>
          <Text style={styles.mono}>{shortAddr(item.hash)}</Text>
          <AntDesign name="copy1" size={14} color="#999" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
        <Text style={[styles.label, { marginTop: p(16) }]}>{lan.t('approval.approveAmount')}</Text>
        <View style={styles.row}>
          {amt.warn ? (
            <MaterialCommunityIcons name="alert" size={16} color="#E1B12B" style={{ marginRight: 4 }} />
          ) : null}
          <Text style={[styles.amount, amt.warn && styles.amountWarn]}>{amt.text}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', marginTop: p(24) }}>
          <TouchableOpacity
            style={styles.revokeBtn}
            disabled={this.state.revokingKey === key}
            onPress={() => this.confirmRevoke(group, item, idx)}
          >
            <Text style={styles.revokeBtnText}>{lan.t('approval.revoke')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  renderGroup(group, gIdx) {
    const risk = tokenRiskLabel(group);
    const symbol = group.token_symbol || 'Token';
    const logo = Images.token[symbol];
    const list = group.approved_list || [];
    return (
      <View key={`${group.token_address}_${gIdx}`} style={styles.card}>
        <View style={styles.rowBetween}>
          <View style={styles.row}>
            {logo ? (
              <Image source={logo} style={styles.tokenIcon} />
            ) : (
              <View style={[styles.tokenIcon, styles.tokenPlaceholder]}>
                <Text style={{ color: '#FFF', fontSize: p(22) }}>{symbol.slice(0, 1)}</Text>
              </View>
            )}
            <View style={{ marginLeft: p(16) }}>
              <Text style={styles.symbol}>{symbol}</Text>
              <Text style={styles.sub}>{group.token_name || ''}</Text>
            </View>
          </View>
          <View style={[styles.row, { maxWidth: p(280) }]}>
            <AntDesign name={risk.ok ? 'checkcircle' : 'warning'} size={14} color={risk.ok ? '#30D158' : '#FF453A'} />
            <Text style={[styles.riskText, { color: risk.ok ? '#30D158' : '#FF453A' }]} numberOfLines={2}>
              {risk.text}
            </Text>
          </View>
        </View>
        <View style={[styles.row, { marginTop: p(16) }]}>
          <Text style={styles.label}>Token </Text>
          <TouchableOpacity style={styles.row} onPress={() => this.copyText(group.token_address)}>
            <Text style={styles.mono}>{shortAddr(group.token_address)}</Text>
            <AntDesign name="copy1" size={14} color="#999" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>
        {list.map((item, idx) => this.renderApproval(group, item, idx))}
      </View>
    );
  }

  render() {
    const { loading, list, error, refreshing } = this.state;
    return (
      <View style={styles.page}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <Head text={lan.t('approval.title')} leftOnPress={() => this.props.navigation.goBack()} />
        <View style={styles.tipRow}>
          <Text style={styles.tip}>{lan.t('approval.tip')}</Text>
          <AntDesign name="infocirlceo" size={16} color="#999" style={{ marginLeft: 8, marginTop: 2 }} />
        </View>
        {loading ? (
          <ActivityIndicator color={Theme.buttonStyle} style={{ marginTop: p(80) }} />
        ) : (
          <ScrollView
            contentContainerStyle={{ paddingBottom: p(60) }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => this.loadList(true)} tintColor={Theme.buttonStyle} />
            }
          >
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {!error && list.length === 0 ? (
              <Text style={styles.empty}>{lan.t('approval.empty')}</Text>
            ) : (
              list.map((g, i) => this.renderGroup(g, i))
            )}
          </ScrollView>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#FFF' },
  tipRow: { flexDirection: 'row', paddingHorizontal: p(28), marginTop: p(20), marginBottom: p(10) },
  tip: { flex: 1, fontSize: p(22), color: '#999', lineHeight: p(34) },
  card: {
    backgroundColor: '#F5F6F8',
    marginHorizontal: p(24),
    marginTop: p(20),
    borderRadius: p(20),
    padding: p(28),
  },
  innerCard: {
    backgroundColor: '#FFF',
    borderRadius: p(16),
    padding: p(24),
    marginTop: p(20),
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tokenIcon: { width: p(72), height: p(72), borderRadius: p(36) },
  tokenPlaceholder: { backgroundColor: '#929191', justifyContent: 'center', alignItems: 'center' },
  symbol: { fontSize: p(30), color: '#131313', fontWeight: '600' },
  sub: { fontSize: p(22), color: '#999', marginTop: p(4) },
  riskText: { fontSize: p(20), marginLeft: p(6), fontWeight: '500' },
  label: { fontSize: p(22), color: '#999' },
  value: { fontSize: p(26), color: '#131313', marginTop: p(6) },
  mono: { fontSize: p(24), color: '#515151' },
  amount: { fontSize: p(28), color: '#131313', fontWeight: '600', marginTop: p(6) },
  amountWarn: { color: '#E1B12B' },
  warnTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFECEC',
    borderRadius: p(20),
    paddingHorizontal: p(16),
    paddingVertical: p(8),
    marginTop: p(12),
  },
  warnTagText: { color: '#cf4545', fontSize: p(22) },
  revokeBtn: {
    backgroundColor: '#FFD24C',
    borderRadius: p(12),
    paddingHorizontal: p(36),
    paddingVertical: p(18),
  },
  revokeBtnText: { color: '#131313', fontSize: p(26), fontWeight: '600' },
  error: { color: '#cf4545', textAlign: 'center', marginTop: p(60), fontSize: p(26) },
  empty: { color: '#999', textAlign: 'center', marginTop: p(80), fontSize: p(28) },
});
