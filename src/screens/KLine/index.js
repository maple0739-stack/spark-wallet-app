/**
 * 行情 K 线。图表用 WebView 里的 KLineChart，不新增 npm 依赖。
 */
import React, {Component} from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Platform,
} from 'react-native';
import {WebView} from 'react-native-webview';
import {Head} from '../../common/Head';
import {fetchDexKlines, fetchDexTicker} from '../../api/fhMarket';

const klinechartsSource = require('./klinechartsLib');

const PERIODS = [
    {key: '1m', labelKey: 'kline.m1'},
    {key: '5m', labelKey: 'kline.m5'},
    {key: '15m', labelKey: 'kline.m15'},
    {key: '1h', labelKey: 'kline.h1'},
    {key: '1d', labelKey: 'kline.d1'},
];
const MAINS = ['MA', 'EMA', 'BOLL'];
const SUBS = ['VOL', 'MACD', 'KDJ', 'RSI'];

const CHART_STYLES = {
    grid: {
        show: true,
        horizontal: {show: true, size: 1, color: '#EDEDED', style: 'dashed', dashedValue: [4, 2]},
        vertical: {show: true, size: 1, color: '#EDEDED', style: 'dashed', dashedValue: [4, 2]},
    },
    candle: {
        type: 'candle_solid',
        bar: {
            upColor: '#32AF68',
            downColor: '#D90606',
            noChangeColor: '#888888',
            upBorderColor: '#32AF68',
            downBorderColor: '#D90606',
            noChangeBorderColor: '#888888',
            upWickColor: '#32AF68',
            downWickColor: '#D90606',
            noChangeWickColor: '#888888',
        },
        tooltip: {showRule: 'always', showType: 'standard'},
        priceMark: {
            show: true,
            last: {
                show: true,
                upColor: '#32AF68',
                downColor: '#D90606',
                noChangeColor: '#888888',
            },
        },
    },
    indicator: {
        ohlc: {
            upColor: 'rgba(50, 175, 104, 0.7)',
            downColor: 'rgba(217, 6, 6, 0.7)',
            noChangeColor: '#888888',
        },
        bars: [{
            upColor: 'rgba(50, 175, 104, 0.7)',
            downColor: 'rgba(217, 6, 6, 0.7)',
            noChangeColor: '#888888',
        }],
        lines: [
            {color: '#FF9600'},
            {color: '#E11D74'},
            {color: '#2196F3'},
        ],
        tooltip: {showRule: 'always', showType: 'standard'},
    },
    xAxis: {
        show: true,
        axisLine: {show: true, color: '#EDEDED', size: 1},
        tickText: {show: true, color: '#76808F', size: 11},
    },
    yAxis: {
        show: true,
        axisLine: {show: true, color: '#EDEDED', size: 1},
        tickText: {show: true, color: '#76808F', size: 11},
    },
    crosshair: {
        show: true,
        horizontal: {
            show: true,
            line: {show: true, style: 'dashed', dashedValue: [4, 2], size: 1, color: '#76808F'},
            text: {show: true, color: '#FFFFFF', size: 12, backgroundColor: '#686D76'},
        },
        vertical: {
            show: true,
            line: {show: true, style: 'dashed', dashedValue: [4, 2], size: 1, color: '#76808F'},
            text: {show: true, color: '#FFFFFF', size: 12, backgroundColor: '#686D76'},
        },
    },
};

function formatPrice(value) {
    const v = parseFloat(value);
    if (!isFinite(v)) return '--';
    const abs = Math.abs(v);
    if (abs >= 100) return v.toFixed(2);
    if (abs >= 1) return v.toFixed(4);
    if (abs >= 0.0001) return v.toFixed(6);
    return v.toPrecision(4);
}

function pricePrecision(value) {
    const v = Math.abs(parseFloat(value));
    if (!isFinite(v) || v === 0) return 2;
    if (v >= 100) return 2;
    if (v >= 1) return 4;
    if (v >= 0.0001) return 6;
    return 8;
}

function formatAmount(value) {
    const v = parseFloat(value);
    if (!isFinite(v)) return '--';
    if (v >= 1e9) return (v / 1e9).toFixed(2) + 'B';
    if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M';
    if (v >= 1e3) return (v / 1e3).toFixed(2) + 'K';
    return v.toFixed(2);
}

function chartLocale() {
    const loc = String((lan && lan.locale) || '').toLowerCase();
    if (loc === 'tw') return 'zh-HK';
    if (loc.indexOf('zh') === 0) return 'zh-CN';
    if (loc === 'jap' || loc.indexOf('ja') === 0) return 'ja-JP';
    if (loc === 'kor' || loc.indexOf('ko') === 0) return 'ko-KR';
    if (loc === 'melayu' || loc === 'ms') return 'ms-MY';
    return 'en-US';
}

function buildChartHtml() {
    const boot = [
        'var chart=null;var subPane=null;',
        'var styles=' + JSON.stringify(CHART_STYLES) + ';',
        'function mainOpt(name){',
        '  if(name==="MA"||name==="EMA") return {name:name,calcParams:[5,10,30]};',
        '  return name;',
        '}',
        'var extraLocales=' + JSON.stringify({
            'zh-HK': {time: '時間：', open: '開：', high: '高：', low: '低：', close: '收：', volume: '成交量：', turnover: '成交額：', change: '漲幅：'},
            'ja-JP': {time: '時間：', open: '始値：', high: '高値：', low: '安値：', close: '終値：', volume: '出来高：', turnover: '売買代金：', change: '変化：'},
            'ko-KR': {time: '시간: ', open: '시가: ', high: '고가: ', low: '저가: ', close: '종가: ', volume: '거래량: ', turnover: '거래대금: ', change: '등락: '},
            'ms-MY': {time: 'Masa: ', open: 'Buka: ', high: 'Tinggi: ', low: 'Rendah: ', close: 'Tutup: ', volume: 'Volum: ', turnover: 'Nilai: ', change: 'Perubahan: '},
        }) + ';',
        'Object.keys(extraLocales).forEach(function(k){ if(klinecharts.registerLocale) klinecharts.registerLocale(k, extraLocales[k]); });',
        'function initChart(){',
        '  chart=klinecharts.init("chart",{styles:styles});',
        '  if(!chart) return;',
        '  chart.setLocale("en-US");',
        '  chart.createIndicator(mainOpt("MA"), false, {id:"candle_pane"});',
        '  subPane=chart.createIndicator("VOL", false, {height:72});',
        '}',
        'function setMain(name){',
        '  if(!chart||!name) return;',
        '  chart.createIndicator(mainOpt(name), false, {id:"candle_pane"});',
        '}',
        'function setSub(name){',
        '  if(!chart||!name) return;',
        '  if(subPane){chart.removeIndicator(subPane);subPane=null;}',
        '  subPane=chart.createIndicator(name, false, {height:72});',
        '}',
        'function applyPatch(list){',
        '  if(!chart||!list||!list.length) return;',
        '  var old=chart.getDataList();',
        '  if(!old||!old.length){chart.applyNewData(list);return;}',
        '  var lastTs=old[old.length-1].timestamp;',
        '  var start=list.length;',
        '  for(var i=0;i<list.length;i++){ if(list[i].timestamp>=lastTs){start=i;break;} }',
        '  for(var j=start;j<list.length;j++){ chart.updateData(list[j]); }',
        '}',
        'function onMessage(e){',
        '  var msg; try{msg=JSON.parse(e.data);}catch(err){return;}',
        '  if(!chart) initChart();',
        '  if(!chart) return;',
        '  if(msg.type==="data"){',
        '    if(msg.locale) chart.setLocale(msg.locale);',
        '    if(msg.precision!=null) chart.setPriceVolumePrecision(msg.precision, 2);',
        '    chart.applyNewData(msg.list||[]);',
        '    setTimeout(function(){ if(chart) chart.resize(); }, 40);',
        '  }else if(msg.type==="patch"){',
        '    applyPatch(msg.list||[]);',
        '  }else if(msg.type==="clear"){',
        '    chart.clearData();',
        '  }else if(msg.type==="main"){',
        '    setMain(msg.name);',
        '  }else if(msg.type==="sub"){',
        '    setSub(msg.name);',
        '  }',
        '}',
        'document.addEventListener("message", onMessage);',
        'window.addEventListener("message", onMessage);',
        'window.addEventListener("resize", function(){ if(chart) chart.resize(); });',
        'initChart();',
        'if(window.ReactNativeWebView){window.ReactNativeWebView.postMessage("ready");}',
    ].join('\n');
    return '<!DOCTYPE html><html><head>'
        + '<meta charset="utf-8"/>'
        + '<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>'
        + '<style>html,body,#chart{margin:0;padding:0;width:100%;height:100%;background:#fff;overflow:hidden;}</style>'
        + '</head><body><div id="chart"></div>'
        + '<script>' + klinechartsSource + '</script>'
        + '<script>' + boot + '</script>'
        + '</body></html>';
}

const CHART_HTML = buildChartHtml();

export default class KLine extends Component {
    static navigationOptions = {
        header: null,
    };

    constructor(props) {
        super(props);
        const params = (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this.state = {
            symbol: params.symbol || 'BTC',
            address: params.address || '',
            platform: params.platform || 'bsc',
            priceUsd: params.priceUsd,
            changePercent24Hr: params.changePercent24Hr,
            high: null,
            low: null,
            quoteVolume: null,
            interval: '5m',
            main: 'MA',
            sub: 'VOL',
            loading: true,
            empty: false,
        };
        this.webRef = null;
        this.webReady = false;
        this.klines = null;
        this.seq = 0;
        this.timer = null;
        this.alive = true;
    }

    componentDidMount() {
        this.loadMarket();
        this.timer = setInterval(() => {
            this.loadMarket();
        }, 20000);
    }

    componentWillUnmount() {
        this.alive = false;
        if (this.timer) clearInterval(this.timer);
        this.seq += 1;
    }

    pair() {
        return this.state.symbol + 'USDT';
    }

    isDex() {
        return !!this.state.address;
    }

    loadMarket() {
        this.loadTicker();
        this.loadKlines();
    }

    loadTicker() {
        if (this.isDex()) {
            const address = this.state.address;
            fetchDexTicker(address, this.state.platform).then((data) => {
                if (!this.alive || address !== this.state.address || !data || data.price == null) return;
                this.setState({
                    priceUsd: data.price,
                    changePercent24Hr: data.change24h,
                    high: data.high,
                    low: data.low,
                    quoteVolume: data.amount,
                });
            });
            return;
        }
        const symbol = this.state.symbol;
        fetch('https://data-api.binance.vision/api/v3/ticker/24hr?symbol=' + this.pair())
            .then((res) => res.json())
            .then((data) => {
                if (!this.alive || symbol !== this.state.symbol || !data || data.lastPrice == null) return;
                this.setState({
                    priceUsd: data.lastPrice,
                    changePercent24Hr: data.priceChangePercent,
                    high: data.highPrice,
                    low: data.lowPrice,
                    quoteVolume: data.quoteVolume,
                });
            })
            .catch(() => {});
    }

    applyKlines(seq, list, patch) {
        if (!this.alive || seq !== this.seq) return;
        if (!list || !list.length) {
            this.klines = null;
            this.setState({loading: false, empty: true});
            this.post({type: 'clear'});
            return;
        }
        this.klines = list;
        this.setState({loading: false, empty: false});
        if (patch) this.post({type: 'patch', list: list});
        else this.pushData();
    }

    loadKlines() {
        const seq = ++this.seq;
        const interval = this.state.interval;
        const patch = !!(this.klines && this.klines.length);
        if (this.isDex()) {
            fetchDexKlines(this.state.address, this.state.platform, interval, 300)
                .then((list) => this.applyKlines(seq, list, patch))
                .catch(() => {
                    if (!this.alive || seq !== this.seq) return;
                    this.setState({loading: false, empty: !this.klines});
                });
            return;
        }
        const url = 'https://data-api.binance.vision/api/v3/klines?symbol='
            + this.pair() + '&interval=' + interval + '&limit=300';
        fetch(url)
            .then((res) => res.json())
            .then((rows) => {
                const list = Array.isArray(rows) ? rows.map((row) => ({
                    timestamp: row[0],
                    open: parseFloat(row[1]),
                    high: parseFloat(row[2]),
                    low: parseFloat(row[3]),
                    close: parseFloat(row[4]),
                    volume: parseFloat(row[5]),
                })) : [];
                this.applyKlines(seq, list, patch);
            })
            .catch(() => {
                if (!this.alive || seq !== this.seq) return;
                this.setState({loading: false, empty: !this.klines});
            });
    }

    post(payload) {
        if (!this.webReady || !this.webRef) return;
        this.webRef.postMessage(JSON.stringify(payload));
    }

    pushData() {
        if (!this.klines || !this.klines.length) return;
        const last = this.klines[this.klines.length - 1];
        this.post({
            type: 'data',
            list: this.klines,
            locale: chartLocale(),
            precision: pricePrecision(last && last.close),
        });
    }

    onWebReady = () => {
        if (this.webReady) {
            this.pushData();
            return;
        }
        this.webReady = true;
        this.pushData();
        this.post({type: 'main', name: this.state.main});
        this.post({type: 'sub', name: this.state.sub});
    };

    onWebMessage = (event) => {
        const data = event && event.nativeEvent && event.nativeEvent.data;
        if (data === 'ready') this.onWebReady();
    };

    changeInterval(key) {
        if (key === this.state.interval) return;
        this.klines = null;
        this.post({type: 'clear'});
        this.setState({interval: key, loading: true, empty: false}, () => {
            this.loadKlines();
        });
    }

    changeMain(name) {
        if (name === this.state.main) return;
        this.setState({main: name});
        this.post({type: 'main', name: name});
    }

    changeSub(name) {
        if (name === this.state.sub) return;
        this.setState({sub: name});
        this.post({type: 'sub', name: name});
    }

    renderStat(label, value) {
        return (
            <View style={styles.statItem}>
                <Text style={styles.statLabel}>{label}</Text>
                <Text style={styles.statValue}>{value}</Text>
            </View>
        );
    }

    render() {
        const {symbol, priceUsd, changePercent24Hr, high, low, quoteVolume, interval, main, sub, loading, empty} = this.state;
        const change = parseFloat(changePercent24Hr);
        const up = isFinite(change) && change >= 0;
        const changeColor = !isFinite(change) ? '#565555' : (up ? '#32AF68' : '#D90606');
        const changeText = isFinite(change)
            ? ((up ? '+' : '') + change.toFixed(2) + '%')
            : '--';
        return (
            <View style={styles.page}>
                <Head
                    text={symbol + '/USDT'}
                    leftOnPress={() => this.props.navigation.goBack()}
                />
                <View style={styles.priceBox}>
                    <View>
                        <Text style={[styles.price, {color: changeColor}]}>${formatPrice(priceUsd)}</Text>
                        <Text style={[styles.change, {color: changeColor}]}>{changeText}</Text>
                    </View>
                    <View style={styles.stats}>
                        {this.renderStat(lan.t('kline.high'), formatPrice(high))}
                        {this.renderStat(lan.t('kline.low'), formatPrice(low))}
                        {this.renderStat(lan.t('kline.amount'), formatAmount(quoteVolume))}
                    </View>
                </View>
                <View style={styles.periods}>
                    {PERIODS.map((item) => {
                        const selected = item.key === interval;
                        return (
                            <TouchableOpacity
                                key={item.key}
                                style={styles.periodBtn}
                                onPress={() => this.changeInterval(item.key)}
                            >
                                <Text style={selected ? styles.periodOn : styles.periodOff}>{lan.t(item.labelKey)}</Text>
                                <View style={selected ? styles.periodBar : styles.periodBarOff}/>
                            </TouchableOpacity>
                        );
                    })}
                </View>
                <View style={styles.chartWrap}>
                    <WebView
                        ref={(ref) => { this.webRef = ref; }}
                        originWhitelist={['*']}
                        source={{html: CHART_HTML}}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        scrollEnabled={false}
                        bounces={false}
                        scalesPageToFit={false}
                        showsHorizontalScrollIndicator={false}
                        showsVerticalScrollIndicator={false}
                        onLoadEnd={this.onWebReady}
                        onMessage={this.onWebMessage}
                        style={styles.chart}
                    />
                    {loading ? (
                        <View pointerEvents="none" style={styles.tipBox}>
                            <Text style={styles.tipText}>{lan.t('quotation.rk5')}</Text>
                        </View>
                    ) : null}
                    {!loading && empty ? (
                        <View pointerEvents="none" style={styles.tipBox}>
                            <Text style={styles.tipText}>{lan.t('kline.empty')}</Text>
                        </View>
                    ) : null}
                </View>
                <View style={styles.indicators}>
                    {MAINS.map((name) => (
                        <TouchableOpacity key={name} style={styles.indBtn} onPress={() => this.changeMain(name)}>
                            <Text style={name === main ? styles.indOn : styles.indOff}>{name}</Text>
                        </TouchableOpacity>
                    ))}
                    <View style={styles.indSplit}/>
                    {SUBS.map((name) => (
                        <TouchableOpacity key={name} style={styles.indBtn} onPress={() => this.changeSub(name)}>
                            <Text style={name === sub ? styles.indOn : styles.indOff}>{name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    page: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    priceBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: p(30),
        paddingBottom: p(10),
    },
    price: {
        fontSize: p(48),
        fontWeight: '600',
    },
    change: {
        fontSize: p(26),
        marginTop: p(6),
        fontWeight: '500',
    },
    stats: {
        alignItems: 'flex-end',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: p(6),
    },
    statLabel: {
        fontSize: p(22),
        color: '#9FA0A3',
        marginRight: p(16),
    },
    statValue: {
        fontSize: p(22),
        color: '#0D1C3D',
        minWidth: p(120),
        textAlign: 'right',
    },
    periods: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: p(10),
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#EEEEEE',
    },
    periodBtn: {
        paddingHorizontal: p(18),
        paddingTop: p(12),
        alignItems: 'center',
    },
    periodOn: {
        fontSize: p(26),
        color: '#0D1C3D',
        fontWeight: '600',
    },
    periodOff: {
        fontSize: p(26),
        color: '#9FA0A3',
    },
    periodBar: {
        marginTop: p(8),
        height: p(4),
        width: p(36),
        borderRadius: p(2),
        backgroundColor: '#0D1C3D',
    },
    periodBarOff: {
        marginTop: p(8),
        height: p(4),
        width: p(36),
        backgroundColor: 'transparent',
    },
    chartWrap: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    chart: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    tipBox: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: p(20),
        alignItems: 'center',
    },
    tipText: {
        fontSize: p(24),
        color: '#9FA0A3',
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: p(12),
    },
    indicators: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#EEEEEE',
        paddingBottom: Platform.OS === 'ios' ? p(24) : p(12),
        paddingTop: p(8),
    },
    indBtn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: p(64),
    },
    indOn: {
        fontSize: p(24),
        color: '#0D1C3D',
        fontWeight: '600',
    },
    indOff: {
        fontSize: p(24),
        color: '#9FA0A3',
    },
    indSplit: {
        width: StyleSheet.hairlineWidth,
        height: p(28),
        backgroundColor: '#DDDDDD',
    },
});
