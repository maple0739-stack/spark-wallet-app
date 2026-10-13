/**
 * Created by zh. on 2019/09/01.
 */

import React, {Component} from 'react';
import {
    ScrollView,
    StatusBar,
    StyleSheet, Text, Image,
    View, TouchableOpacity,
} from 'react-native' ;
import {Images} from "../resource";
import {fetchFhTicker, FH_MARKET} from "../api/fhMarket";

export default class Quotation extends Component {
    constructor(props) {
        super(props);
    }
    // 状态
    state = {
        coinList:[],
        fhQuote:null,
        betInfo:null
    };

    componentDidMount(){
        this.getCoinList();

        this.timer = setInterval(()=>{
            this.getCoinList();
        },30000);
    }

    componentWillUnmount(){
        if(this.timer) clearInterval(this.timer);
    }

    getCoinList(){
        this.loadFhQuote();
        const MARKET_CAP_RANK = [
            'BTC','ETH','BNB','XRP','SOL','USDC','DOGE','TRX','ADA','AVAX',
            'LINK','TON','SHIB','SUI','DOT','BCH','NEAR','LTC','APT','UNI',
            'PEPE','ICP','ETC','AAVE','FET','ATOM','FIL','ARB','OP','IMX',
            'INJ','STX','GRT','RUNE','ALGO','SEI','HBAR','VET','THETA','SAND',
            'MANA','AXS','EGLD','XTZ','FLOW','NEO','IOTA','EOS','CRV','LDO'
        ];
        let symbols = encodeURIComponent(JSON.stringify(MARKET_CAP_RANK.map(s => s + 'USDT')));
        let url = "https://data-api.binance.vision/api/v3/ticker/24hr?symbols=" + symbols;
        fetch(url).then(res => res.json()).then(res => {
            if(res && Array.isArray(res)){
                let map = {};
                res.forEach(item => { map[item.symbol] = item; });
                let list = MARKET_CAP_RANK.map(base => {
                    let item = map[base + 'USDT'];
                    if(!item) return null;
                    return {
                        id: item.symbol,
                        symbol: base,
                        name: item.symbol,
                        priceUsd: item.lastPrice,
                        changePercent24Hr: item.priceChangePercent,
                    };
                }).filter(Boolean);
                this.setState({ coinList: list });
            }
        }).catch(() => {})
    }

    loadFhQuote(){
        fetchFhTicker().then((data) => {
            if(!data || data.price == null || isNaN(data.price)) return;
            this.setState({
                fhQuote: {
                    id: 'FH',
                    symbol: FH_MARKET.symbol,
                    name: 'FHUSDT',
                    localIcon: true,
                    address: data.address,
                    platform: data.platform,
                    priceUsd: data.price,
                    changePercent24Hr: data.change24h,
                }
            });
        });
    }

    openKLine(item){
        if(!isKline) return;
        this.props.navigation.navigate('KLine', {
            symbol: item.symbol,
            priceUsd: item.priceUsd,
            changePercent24Hr: item.changePercent24Hr,
            address: item.address,
            platform: item.platform,
        });
    }


    // 渲染
    render() {
        let {coinList, fhQuote} = this.state;
        const rows = fhQuote ? [fhQuote].concat(coinList) : coinList;

        return (
            <View style={{ flex: 1, backgroundColor: Theme.backgroundColor }}>

                <View style={styles.View_01}>
                    <Text style={styles.check_01}>
                        {lan.t('news.daibihangqing')}
                    </Text>
                </View>
                <View style={{width:WIDTH,height:p(15),backgroundColor: '#F6F7FD'}}/>
                <View style={styles.View_03}>
                    <View style={styles.View_002}>
                        <Text style={styles.Text_02}>{lan.t('quotation.rk1')}</Text>

                        <Text style={styles.Text_02}>{lan.t('quotation.rk2')}</Text>

                        <Text style={styles.Text_02}>{lan.t('quotation.rk3')}</Text>
                    </View>
                </View>
                {
                    rows.length>0?
                        <ScrollView>
                            {
                                rows.map((item)=> {
                                    let chg = parseFloat(item.changePercent24Hr);
                                    let chgOk = isFinite(chg);
                                    let price_usd = parseFloat(item.priceUsd).toFixed(2);
                                    let price_rmb = parseFloat(price_usd * 7.2).toFixed(2);
                                    let uri = "https://assets.coincap.io/assets/icons/" + (item.symbol || '').toLowerCase() + "@2x.png";
                                    return (
                                        <TouchableOpacity key={item.id} activeOpacity={isKline ? 0.75 : 1} disabled={!isKline} style={styles.View_04} onPress={() => this.openKLine(item)}>
                                            <View style={styles.View_02}>
                                                <View style={{flexDirection: 'row', alignItems: 'center',
                                                    width:WIDTH/3,marginLeft: p(15)}}>
                                                    <Image
                                                        resizeMode="stretch"
                                                        source={item.localIcon ? Images.token.FH : {uri: uri}}
                                                        style={{width: p(60), height: p(60), borderRadius: p(30)}}
                                                        onError={item.localIcon ? undefined : () => {
                                                            this.setState(prev => ({
                                                                coinList: prev.coinList.filter(c => c.id !== item.id)
                                                            }));
                                                        }}
                                                    />

                                                    <View style={{marginLeft: p(20)}}>
                                                        <Text style={styles.Text_03}>
                                                            {item.symbol}
                                                        </Text>
                                                        <Text style={{
                                                            fontSize: p(22),
                                                            color:'#9FA0A3'}}>
                                                            {item.name}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <View style={{width:WIDTH/3}}>
                                                    <Text style={styles.Text_06}>
                                                        {price_rmb}
                                                    </Text>
                                                    <Text style={styles.Text_05}>
                                                        ${price_usd}
                                                    </Text>
                                                </View>
                                                {
                                                    chgOk && chg>0?
                                                        <View style={styles.View_05}>
                                                            <Text style={styles.Text_07}>
                                                                +{chg.toFixed(2)}%
                                                            </Text>
                                                        </View>
                                                        :
                                                        <View style={styles.View_06}>
                                                            <Text style={styles.Text_07}>
                                                                {chgOk ? chg.toFixed(2)+'%' : '--'}
                                                            </Text>
                                                        </View>
                                                }


                                            </View>
                                        </TouchableOpacity>
                                    )
                                })
                            }
                        </ScrollView>
                        :
                        <View style={{justifyContent:'center',alignItems:'center',height:HEIGHT/2}}>
                            <Text style={styles.Text_05}>
                                {lan.t('quotation.rk5')}...
                            </Text>
                        </View>


                }

            </View>

        )
    }

}


const styles = StyleSheet.create({
    Text_07:{
        fontSize: p(24),
        color:'#FFF',
        fontWeight:'500'
    },
    View_06:{
        justifyContent:'center',
        alignItems:'center',
        height: p(65),
        width:p(125),
        borderRadius:p(20),
        backgroundColor:'#D90606',
        marginRight: p(15)
    },
    View_05:{
        justifyContent:'center',
        alignItems:'center',
        height: p(65),
        width:p(125),
        borderRadius:p(20),
        backgroundColor:'#32AF68',
        marginRight: p(15)
    },
    Text_06:{
        fontSize: p(30),
        color:'#0D1C3D',
        fontWeight: '500'
    },
    Text_05:{
        fontSize: p(22),
        color:'#565555',
        marginTop: p(10)
    },
    Text_04:{
        fontSize: p(26),
        color:'#2c2c2c',
    },
    Text_03:{
        fontSize: p(30),
        color:'#0D1C3D',
        fontWeight: '500'
    },
    View_04:{
        justifyContent:'center',
        alignItems:'center',
    },
    View_03:{
        justifyContent:'center',
        alignItems:'center',
        height: p(100),
    },
    Text_02:{
        fontSize: p(26),
        color:'#666666',
        fontWeight: '500'
    },
    View_002:{
        justifyContent:'space-between',
        alignItems:'center',
        flexDirection: 'row',
        width:WIDTH-p(80),
        height: p(100),
        marginTop: p(15)
    },
    View_02:{
        justifyContent:'space-between',
        alignItems:'center',
        flexDirection: 'row',
        width:WIDTH-p(50),
        height: p(120),
        backgroundColor: '#F5F6F8',
        borderRadius: p(10),
        marginTop: p(15)
    },
    check_01:{
        color: '#060605',
        fontSize: p(32),
        fontWeight :'500',
        marginTop:p(30)
    },
    View_01:{
        height: p(120),
        justifyContent:'center',
        alignItems:'center'
    }

});

