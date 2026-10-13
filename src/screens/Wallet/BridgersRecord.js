import React, { Component } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { Head } from '../../common/Head';
import { Images } from '../../resource';
import { getTransData, formatStatus } from '../../api/bridgers';

const CHAIN_ICON = {
  BSC: 'BNB',
  BNB: 'BNB',
  ETH: 'ETH',
  TRON: 'TRX',
  TRX: 'TRX',
  HECO: 'HT',
  POLYGON: 'MATIC',
  ARBITRUM: 'ETH',
  OPTIMISM: 'OP',
  BASE: 'ETH',
};

export default class BridgersRecord extends Component {
  static navigationOptions = { header: null };

  state = {
    list: [],
    refreshing: false,
    pageNo: 1,
    total: 0,
  };

  componentDidMount() {
    this.loadList(1);
    this.focusListener = this.props.navigation.addListener('didFocus', () => {
      this.loadList(1);
    });
  }

  componentWillUnmount() {
    this.focusListener && this.focusListener.remove();
  }

  symbolBase(code) {
    if (!code) return '';
    return String(code).replace(/\(.*\)$/, '').toUpperCase();
  }

  chainFromCode(code, fallback) {
    if (!code) return fallback || '';
    const m = String(code).match(/\(([^)]+)\)/);
    return m ? m[1] : (fallback || '');
  }

  tokenIcon(code) {
    const base = this.symbolBase(code);
    if (Images.token[base]) return Images.token[base];
    if (base === 'WBNB' || base === 'BNB') return Images.token.BNB;
    if (base.indexOf('USDT') >= 0) return Images.token.USDT;
    if (base.indexOf('USDC') >= 0) return Images.token.USDC;
    return Images.token.NULL || Images.token.ETH;
  }

  chainIcon(chain, code) {
    const c = chain || this.chainFromCode(code);
    const key = CHAIN_ICON[c] || CHAIN_ICON[String(c).toUpperCase()];
    if (key && Images.token[key]) return Images.token[key];
    return Images.token.BNB;
  }

  statusView(status) {
    if (status === 'receive_complete') {
      return (
        <View style={styles.doneTag}>
          <Text style={styles.doneText}>{lan.t('bridgers.st_receive_complete')}</Text>
        </View>
      );
    }
    return <Text style={styles.pendingText}>{formatStatus(status)}</Text>;
  }

  async loadList(pageNo) {
    if (!walletAddress) {
      this.setState({ list: [], refreshing: false });
      return;
    }
    try {
      const data = await getTransData({
        fromAddress: walletAddress,
        pageNo: pageNo || 1,
        pageSize: 20,
      });
      const rows = data.list || [];
      this.setState({
        list: pageNo > 1 ? (this.state.list || []).concat(rows) : rows,
        pageNo: pageNo || 1,
        total: data.total || 0,
        refreshing: false,
      });
    } catch (e) {
      this.setState({ refreshing: false });
      Toast.info(String(e.message || e).slice(0, 80));
    }
  }

  onRefresh() {
    this.setState({ refreshing: true });
    this.loadList(1);
  }

  renderIcon(code, chain) {
    return (
      <View style={styles.iconWrap}>
        <Image style={styles.tokenIcon} source={this.tokenIcon(code)} />
        <Image style={styles.chainBadge} source={this.chainIcon(chain, code)} />
      </View>
    );
  }

  renderItem({ item }) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHead}>
          <Text style={styles.timeText}>{item.createTime || '--'}</Text>
          {this.statusView(item.status)}
        </View>
        <View style={styles.cardBody}>
          <View style={styles.sideLeft}>
            {this.renderIcon(item.fromCoinCode, item.fromChain)}
            <View style={{ marginLeft: p(14) }}>
              <Text style={styles.coinCode}>{item.fromCoinCode || '--'}</Text>
              <Text style={styles.amountText}>{item.fromTokenAmount || '0'}</Text>
            </View>
          </View>
          <View style={styles.arrowWrap}>
            <AntDesign name="arrowright" size={p(26)} color="#999" />
          </View>
          <View style={styles.sideRight}>
            <View style={{ marginRight: p(14), alignItems: 'flex-end' }}>
              <Text style={styles.coinCode}>{item.toCoinCode || '--'}</Text>
              <Text style={styles.amountText}>{item.toTokenAmount || '0'}</Text>
            </View>
            {this.renderIcon(item.toCoinCode, item.toChain)}
          </View>
        </View>
      </View>
    );
  }

  render() {
    const { list, refreshing } = this.state;
    return (
      <View style={styles.page}>
        <Head text={lan.t('bridgers.txRecords')} leftOnPress={() => this.props.navigation.goBack()} />
        <FlatList
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: p(24), paddingBottom: p(40), paddingTop: p(10) }}
          data={list}
          keyExtractor={(item, i) => (item.orderId || String(item.id)) + '_' + i}
          renderItem={(p) => this.renderItem(p)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => this.onRefresh()} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ color: '#999', fontSize: p(26) }}>{lan.t('bridgers.noRecord')}</Text>
            </View>
          }
          onEndReached={() => {
            if ((list || []).length >= 20 * this.state.pageNo) {
              this.loadList(this.state.pageNo + 1);
            }
          }}
          onEndReachedThreshold={0.2}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F5F6F8',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: p(20),
    paddingHorizontal: p(28),
    paddingVertical: p(24),
    marginBottom: p(20),
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: p(22),
  },
  timeText: {
    color: '#111',
    fontSize: p(26),
  },
  doneTag: {
    backgroundColor: '#E8F8EF',
    borderRadius: p(8),
    paddingHorizontal: p(14),
    paddingVertical: p(6),
  },
  doneText: {
    color: '#22C55E',
    fontSize: p(22),
  },
  pendingText: {
    color: '#999',
    fontSize: p(24),
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sideLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sideRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  iconWrap: {
    width: p(64),
    height: p(64),
  },
  tokenIcon: {
    width: p(56),
    height: p(56),
    borderRadius: p(28),
  },
  chainBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: p(26),
    height: p(26),
    borderRadius: p(13),
    borderWidth: 1,
    borderColor: '#FFF',
  },
  coinCode: {
    color: '#111',
    fontSize: p(28),
    fontWeight: '600',
  },
  amountText: {
    color: '#999',
    fontSize: p(24),
    marginTop: p(6),
  },
  arrowWrap: {
    width: p(44),
    height: p(44),
    borderRadius: p(22),
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: p(10),
  },
  empty: {
    marginTop: p(200),
    alignItems: 'center',
  },
});
