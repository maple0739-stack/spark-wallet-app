import React, { Component } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Image,
    Platform,
    ScrollView,
} from 'react-native';
import { Overlay } from 'teaset';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Tx from 'ethereumjs-tx';
import Web3 from 'web3';
import { Head } from '../../common/Head';
import { Images } from '../../resource';
import * as BlockChainService from '../../blockchain/BlockChainService';
import {
    PANCAKE_V2_ROUTER,
    SWAP_TOKENS,
    toWei,
    fromWei,
    applySlippage,
    quoteOut,
    quoteDetails,
    routeSymbols,
    buildSwapData,
    tokenBySymbol,
} from './pancake';

const SLIPPAGES = [5, 10, 15];

function trimAmount(value) {
    const n = parseFloat(value);
    if (!isFinite(n)) return '0';
    if (n === 0) return '0';
    if (n >= 1) return n.toFixed(6).replace(/\.?0+$/, '');
    if (n >= 0.0001) return n.toFixed(6).replace(/\.?0+$/, '');
    return n.toFixed(10).replace(/\.?0+$/, '');
}

function formatUsd(value) {
    const n = parseFloat(value);
    if (!isFinite(n) || n <= 0) return '--';
    if (n < 0.001) return '<$0.001';
    if (n < 1) return '$' + n.toFixed(4);
    return '$' + n.toFixed(2);
}

export default class Swap extends Component {
    static navigationOptions = {
        header: null,
    };

    constructor(props) {
        super(props);
        this.state = {
            fromSymbol: 'FH',
            toSymbol: 'USDT',
            fromAmount: '',
            toAmount: '',
            fromBalance: '0',
            toBalance: '0',
            bnbBalance: '0',
            slippage: 10,
            quoting: false,
            swapping: false,
            password: '',
            outWei: '',
            impact: 0,
            hops: 1,
            feeRate: 0.0025,
            bnbUsd: 0,
            fhUsd: 0,
            rateFlip: false,
            showSlip: false,
        };
        this.quoteSeq = 0;
        this.quoteTimer = null;
        this.alive = true;
    }

    componentDidMount() {
        this.loadBalances();
        this.loadPrices();
    }

    componentWillUnmount() {
        this.alive = false;
        if (this.quoteTimer) clearTimeout(this.quoteTimer);
        this.quoteSeq += 1;
    }

    onBnbChain() {
        return useChainInfo && useChainInfo.chainSymbol === 'BNB';
    }

    loadBalances() {
        if (!walletAddress || !this.onBnbChain()) return;
        const from = tokenBySymbol(this.state.fromSymbol);
        const to = tokenBySymbol(this.state.toSymbol);
        BlockChainService.getBalance(walletAddress, { address: '', decimals: 18 }).then((bnb) => {
            if (!this.alive) return;
            this.setState({ bnbBalance: String(bnb || 0) });
        });
        BlockChainService.getBalance(walletAddress, { address: from.address, decimals: 18 }).then((v) => {
            if (!this.alive) return;
            this.setState({ fromBalance: String(v || 0) });
        });
        BlockChainService.getBalance(walletAddress, { address: to.address, decimals: 18 }).then((v) => {
            if (!this.alive) return;
            this.setState({ toBalance: String(v || 0) });
        });
    }

    loadPrices() {
        if (!this.onBnbChain()) return;
        quoteOut('BNB', 'USDT', toWei('1')).then((wei) => {
            if (!this.alive || !wei) return;
            this.setState({ bnbUsd: parseFloat(fromWei(wei)) || 0 });
        });
        quoteOut('FH', 'USDT', toWei('1')).then((wei) => {
            if (!this.alive || !wei) return;
            this.setState({ fhUsd: parseFloat(fromWei(wei)) || 0 });
        });
    }

    scheduleQuote(amount) {
        if (this.quoteTimer) clearTimeout(this.quoteTimer);
        const text = amount != null ? amount : this.state.fromAmount;
        if (!text || !parseFloat(text)) {
            this.setState({ toAmount: '', quoting: false, outWei: '', impact: 0 });
            return;
        }
        this.setState({ quoting: true });
        this.quoteTimer = setTimeout(() => this.fetchQuote(text), 400);
    }

    fetchQuote(amount, retry) {
        if (!this.onBnbChain()) {
            this.setState({ quoting: false, toAmount: '', outWei: '', impact: 0 });
            return;
        }
        const seq = ++this.quoteSeq;
        let amountWei;
        try {
            amountWei = toWei(amount);
        } catch (e) {
            this.setState({ quoting: false, toAmount: '', outWei: '', impact: 0 });
            return;
        }
        quoteDetails(this.state.fromSymbol, this.state.toSymbol, amountWei).then((detail) => {
            if (!this.alive || seq !== this.quoteSeq) return;
            if (!detail || !detail.outWei) {
                if ((retry || 0) < 2) {
                    setTimeout(() => {
                        if (!this.alive || seq !== this.quoteSeq) return;
                        this.fetchQuote(amount, (retry || 0) + 1);
                    }, 800);
                    return;
                }
                this.setState({ quoting: false, toAmount: '', outWei: '', impact: 0 });
                return;
            }
            this.setState({
                quoting: false,
                outWei: detail.outWei,
                impact: detail.impact || 0,
                hops: detail.hops || 1,
                feeRate: detail.feeRate || 0.0025,
                toAmount: trimAmount(fromWei(detail.outWei)),
            });
        }).catch(() => {
            if (!this.alive || seq !== this.quoteSeq) return;
            if ((retry || 0) < 2) {
                setTimeout(() => {
                    if (!this.alive || seq !== this.quoteSeq) return;
                    this.fetchQuote(amount, (retry || 0) + 1);
                }, 800);
                return;
            }
            this.setState({ quoting: false, toAmount: '', outWei: '', impact: 0 });
        });
    }

    changeAmount(text) {
        let value = String(text || '').replace(/[^\d.]/g, '');
        const parts = value.split('.');
        if (parts.length > 2) value = parts[0] + '.' + parts.slice(1).join('');
        if (parts[1] && parts[1].length > 8) value = parts[0] + '.' + parts[1].slice(0, 8);
        this.setState({ fromAmount: value });
        this.scheduleQuote(value);
    }

    fillMax() {
        const raw = parseFloat(this.state.fromBalance) || 0;
        let amount = raw;
        if (this.state.fromSymbol === 'BNB') amount = Math.max(raw - 0.003, 0);
        const text = trimAmount(amount);
        this.setState({ fromAmount: text === '0' ? '' : text });
        this.scheduleQuote(text === '0' ? '' : text);
    }

    flip() {
        this.setState((s) => ({
            fromSymbol: s.toSymbol,
            toSymbol: s.fromSymbol,
            fromAmount: '',
            toAmount: '',
        }), () => this.loadBalances());
    }

    chooseToken(side, symbol) {
        if (this.overlayPick) this.overlayPick.close();
        this.setState((s) => {
            const next = { fromAmount: '', toAmount: '' };
            if (side === 'from') {
                next.fromSymbol = symbol;
                next.toSymbol = symbol === s.toSymbol ? s.fromSymbol : s.toSymbol;
            } else {
                next.toSymbol = symbol;
                next.fromSymbol = symbol === s.fromSymbol ? s.toSymbol : s.fromSymbol;
            }
            return next;
        }, () => this.loadBalances());
    }

    tokenBalance(symbol) {
        if (symbol === 'BNB') return this.state.bnbBalance;
        if (symbol === this.state.fromSymbol) return this.state.fromBalance;
        if (symbol === this.state.toSymbol) return this.state.toBalance;
        return '0';
    }

    shortAddress(address) {
        if (!address) return lan.t('swap.native');
        return address.substring(0, 6) + '...' + address.substring(address.length - 4);
    }

    openPicker(side) {
        const current = side === 'from' ? this.state.fromSymbol : this.state.toSymbol;
        const overlayView = (
            <Overlay.PullView
                side="bottom"
                modal={false}
                ref={(v) => { this.overlayPick = v; }}
            >
                <View style={styles.sheet}>
                    {SWAP_TOKENS.map((item) => (
                        <TouchableOpacity
                            key={item.symbol}
                            style={styles.sheetRow}
                            onPress={() => this.chooseToken(side, item.symbol)}
                        >
                            <Image source={Images.token[item.symbol]} style={styles.sheetIcon} />
                            <View style={styles.sheetInfo}>
                                <View style={styles.sheetNameRow}>
                                    <Text style={styles.sheetText}>{item.symbol}</Text>
                                    {item.symbol === current ? (
                                        <AntDesign name="check" size={16} color="#32AF68" style={{ marginLeft: p(8) }} />
                                    ) : null}
                                </View>
                                <Text style={styles.sheetAddr}>{this.shortAddress(item.address)}</Text>
                            </View>
                            <Text style={styles.sheetBal}>{trimAmount(this.tokenBalance(item.symbol))}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </Overlay.PullView>
        );
        Overlay.show(overlayView);
    }

    openPassword() {
        if (!this.onBnbChain()) {
            Toast.info(lan.t('swap.onlyBnb'));
            return;
        }
        const amount = parseFloat(this.state.fromAmount);
        if (!amount) {
            Toast.info(lan.t('swap.noAmount'));
            return;
        }
        if (amount > parseFloat(this.state.fromBalance || 0)) {
            Toast.info(lan.t('swap.noBalance'));
            return;
        }
        if (this.state.fromSymbol !== 'BNB' && parseFloat(this.state.bnbBalance || 0) < 0.0005) {
            Toast.info(lan.t('swap.needGas'));
            return;
        }
        if (this.state.quoting) {
            Toast.info(lan.t('bridgers.quoting'));
            return;
        }
        if (!this.state.toAmount || !this.state.outWei) {
            Toast.info(lan.t('swap.noQuote'));
            this.scheduleQuote(this.state.fromAmount);
            return;
        }
        const overlayView = (
            <Overlay.PopView style={{ alignItems: 'center', justifyContent: 'center' }} ref={(v) => { this.overlayPwd = v; }}>
                <View style={styles.pwdBox}>
                    <Text style={styles.pwdTitle}>{lan.t('pay.zhifuqueren')}</Text>
                    <TextInput
                        secureTextEntry
                        placeholder={lan.t('pay.qingshurqianbaomima')}
                        placeholderTextColor="#B0B0B0"
                        onChangeText={(password) => this.setState({ password })}
                        style={styles.pwdInput}
                    />
                    <View style={styles.pwdActions}>
                        <TouchableOpacity style={styles.pwdBtn} onPress={() => this.overlayPwd && this.overlayPwd.close()}>
                            <Text style={styles.pwdCancel}>{lan.t('all.cancel')}</Text>
                        </TouchableOpacity>
                        <View style={styles.pwdSplit} />
                        <TouchableOpacity style={styles.pwdBtn} onPress={() => this.confirmSwap()}>
                            <Text style={styles.pwdOk}>{lan.t('all.confirm')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Overlay.PopView>
        );
        Overlay.show(overlayView);
    }

    broadcast(to, data, valueWei) {
        const rpcUrl = (useChainInfo && useChainInfo.chainUrl) || 'https://bsc.publicnode.com';
        const chainWeb3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));
        const gwei = Math.max(Number(global.BnbGwei) || 0, 3);
        return new Promise((resolve) => {
            chainWeb3.eth.getTransactionCount(walletAddress, 'pending', (err, nonce) => {
                if (err != null && (nonce === undefined || nonce === null)) {
                    resolve('');
                    return;
                }
                try {
                    const transaction = {
                        chainId: Number(useChainInfo.chainId),
                        nonce: nonce,
                        gasPrice: chainWeb3.toHex(gwei * Math.pow(10, 9)),
                        gasLimit: chainWeb3.toHex(650000),
                        to: to,
                        value: chainWeb3.toHex(chainWeb3.toBigNumber(valueWei || '0')),
                        data: data || '0x',
                    };
                    let pk = walletPrivateKey || '';
                    if (pk.substring(0, 2) === '0x') pk = pk.substring(2);
                    const tx = new Tx(transaction);
                    tx.sign(new Buffer(pk, 'hex'));
                    chainWeb3.eth.sendRawTransaction('0x' + tx.serialize().toString('hex'), (e2, hash) => {
                        resolve(e2 || !hash ? '' : hash);
                    });
                } catch (e) {
                    resolve('');
                }
            });
        });
    }

    waitReceipt(hash) {
        return new Promise((resolve) => {
            let n = 0;
            const tick = () => {
                BlockChainService.getTransactionReceipt(hash).then((status) => {
                    const ok = status === '0x1' || status === '0x01' || status === true || status === 1;
                    const fail = status === '0x0' || status === '0x00' || status === false || status === 0;
                    if (ok) resolve(true);
                    else if (fail) resolve(false);
                    else if (n++ > 15) resolve(false);
                    else setTimeout(tick, 2000);
                });
            };
            tick();
        });
    }

    async ensureApprove(tokenAddress, amountHuman) {
        const allow = await BlockChainService.getAllowance(tokenAddress, PANCAKE_V2_ROUTER);
        if (parseFloat(allow) >= parseFloat(amountHuman)) return true;
        Loading.show(lan.t('bridgers.approving'));
        const data = BlockChainService.getApproveData(tokenAddress, PANCAKE_V2_ROUTER);
        const hash = await this.broadcast(tokenAddress, data, '0');
        if (!hash) {
            Loading.hide();
            Toast.info(lan.t('bridgers.approveFail'));
            return false;
        }
        const ok = await this.waitReceipt(hash);
        Loading.hide();
        if (!ok) {
            Toast.info(lan.t('bridgers.approveFail'));
            return false;
        }
        Toast.success(lan.t('bridgers.approveSuccess'));
        return true;
    }

    async confirmSwap() {
        if (this.state.password !== walletPassword) {
            Toast.info(lan.t('wallet.passwordError'));
            return;
        }
        if (this.overlayPwd) this.overlayPwd.close();
        const { fromSymbol, toSymbol, fromAmount, slippage } = this.state;
        this.setState({ swapping: true });
        Loading.show(lan.t('bridgers.swapping'));
        try {
            const amountInWei = toWei(fromAmount);
            const outWei = await quoteOut(fromSymbol, toSymbol, amountInWei);
            if (!outWei) {
                Loading.hide();
                this.setState({ swapping: false });
                Toast.info(lan.t('bridgers.swapFail'));
                return;
            }
            const fromToken = tokenBySymbol(fromSymbol);
            if (fromToken.address) {
                const approved = await this.ensureApprove(fromToken.address, fromAmount);
                if (!approved) {
                    this.setState({ swapping: false });
                    return;
                }
                Loading.show(lan.t('bridgers.swapping'));
            }
            const minOut = applySlippage(outWei, slippage);
            const data = buildSwapData(fromSymbol, toSymbol, amountInWei, minOut, walletAddress);
            const valueWei = fromSymbol === 'BNB' ? amountInWei : '0';
            const hash = await this.broadcast(PANCAKE_V2_ROUTER, data, valueWei);
            Loading.hide();
            this.setState({ swapping: false });
            if (!hash) {
                Toast.info(lan.t('bridgers.swapFail'));
                return;
            }
            Toast.success(lan.t('swap.success'));
            this.setState({ fromAmount: '', toAmount: '' });
            this.loadBalances();
        } catch (e) {
            Loading.hide();
            this.setState({ swapping: false });
            Toast.info(lan.t('bridgers.swapFail'));
        }
    }

    priceOf(symbol) {
        if (symbol === 'USDT') return 1;
        if (symbol === 'BNB') return this.state.bnbUsd || 0;
        if (symbol === 'FH') return this.state.fhUsd || 0;
        return 0;
    }

    networkFeeText() {
        const gwei = global.BnbGwei || 3;
        const gas = this.state.hops > 1 ? 280000 : 180000;
        const bnb = gas * gwei / 1e9;
        return trimAmount(bnb) + ' BNB';
    }

    tradingFeeText() {
        const amount = parseFloat(this.state.fromAmount);
        if (!amount || !this.state.feeRate) return '--';
        const feeToken = amount * this.state.feeRate;
        const usd = feeToken * this.priceOf(this.state.fromSymbol);
        return formatUsd(usd);
    }

    minReceivedText() {
        if (!this.state.outWei) return '--';
        const minWei = applySlippage(this.state.outWei, this.state.slippage);
        return trimAmount(fromWei(minWei)) + ' ' + this.state.toSymbol;
    }

    rateText() {
        const amountIn = parseFloat(this.state.fromAmount);
        const amountOut = parseFloat(this.state.toAmount);
        if (!amountIn || !amountOut) return '--';
        const { fromSymbol, toSymbol, rateFlip } = this.state;
        if (rateFlip) {
            return '1 ' + toSymbol + '  =  ' + trimAmount(amountIn / amountOut) + ' ' + fromSymbol;
        }
        return '1 ' + fromSymbol + '  =  ' + trimAmount(amountOut / amountIn) + ' ' + toSymbol;
    }

    impactText() {
        if (!this.state.outWei) return '--';
        const n = this.state.impact || 0;
        if (n < 0.01) return '<0.01%';
        return n.toFixed(2) + '%';
    }

    impactColor() {
        const n = this.state.impact || 0;
        if (!this.state.outWei || n < 1) return '#32AF68';
        if (n < 5) return '#C47B00';
        return '#D90606';
    }

    renderDetailRow(label, value, valueStyle) {
        return (
            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{label}</Text>
                <Text style={[styles.detailValue, valueStyle]}>{value}</Text>
            </View>
        );
    }

    renderTokenRow(side, symbol, amountNode) {
        return (
            <View style={[styles.card, side === 'from' && styles.fromCard]}>
                <View style={styles.cardTop}>
                    <Text style={styles.cardLabel}>{side === 'from' ? lan.t('swap.from') : lan.t('swap.to')}</Text>
                    <TouchableOpacity onPress={() => side === 'from' && this.fillMax()}>
                        <Text style={styles.balanceText}>
                            {lan.t('swap.balance')} {trimAmount(side === 'from' ? this.state.fromBalance : this.state.toBalance)}
                            {side === 'from' ? '  ' + lan.t('swap.max') : ''}
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={[styles.cardBody, side === 'from' && styles.fromBody]}>
                    <TouchableOpacity style={styles.tokenBtn} onPress={() => this.openPicker(side)}>
                        <Image source={Images.token[symbol]} style={styles.tokenIcon} />
                        <Text style={styles.tokenSymbol}>{symbol}</Text>
                        <AntDesign name="down" size={12} color="#9FA0A3" />
                    </TouchableOpacity>
                    {amountNode}
                </View>
            </View>
        );
    }

    render() {
        const { fromSymbol, toSymbol, fromAmount, toAmount, slippage, quoting, swapping, showSlip } = this.state;
        const onBnb = this.onBnbChain();
        const route = routeSymbols(fromSymbol, toSymbol);
        return (
            <View style={styles.page}>
                <Head text={lan.t('news.duihuan')} leftOnPress={() => this.props.navigation.goBack()} />
                <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
                    {!onBnb ? (
                        <View style={styles.banner}>
                            <Text style={styles.bannerText}>{lan.t('swap.onlyBnb')}</Text>
                        </View>
                    ) : null}
                    {this.renderTokenRow('from', fromSymbol, (
                        <TextInput
                            style={styles.amountInput}
                            value={fromAmount}
                            onChangeText={(t) => this.changeAmount(t)}
                            keyboardType="decimal-pad"
                            placeholder="0"
                            placeholderTextColor="#C8C8C8"
                        />
                    ))}
                    <TouchableOpacity style={styles.flip} onPress={() => this.flip()}>
                        <AntDesign name="swap" size={22} color="#0D1C3D" />
                    </TouchableOpacity>
                    {this.renderTokenRow('to', toSymbol, (
                        <Text style={styles.estimate}>
                            {quoting ? '...' : (toAmount || '0')}
                        </Text>
                    ))}
                    <View style={styles.slipHead}>
                        <Text style={styles.slipLabel}>{lan.t('swap.slippage')}</Text>
                        <TouchableOpacity style={styles.slipPill} onPress={() => this.setState({ showSlip: !showSlip })}>
                            <Text style={styles.slipPillText}>{slippage.toFixed(2)}%</Text>
                            <AntDesign name="edit" size={14} color="#5B6CFF" style={{ marginLeft: p(8) }} />
                        </TouchableOpacity>
                    </View>
                    {showSlip ? (
                        <View style={styles.slipRow}>
                            {SLIPPAGES.map((item) => (
                                <TouchableOpacity
                                    key={item}
                                    style={item === slippage ? styles.slipOn : styles.slipOff}
                                    onPress={() => this.setState({ slippage: item, showSlip: false })}
                                >
                                    <Text style={item === slippage ? styles.slipOnText : styles.slipOffText}>{item}%</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ) : null}
                    <TouchableOpacity
                        style={[styles.submit, (!onBnb || swapping) && { opacity: 0.5 }]}
                        disabled={!onBnb || swapping}
                        onPress={() => this.openPassword()}
                    >
                        <Text style={styles.submitText}>
                            {swapping ? lan.t('bridgers.swapping') : lan.t('bridgers.swap')}
                        </Text>
                    </TouchableOpacity>
                    <View style={styles.detailCard}>
                        <View style={styles.rateRow}>
                            <View style={styles.rateLeft}>
                                <TouchableOpacity onPress={() => this.scheduleQuote()}>
                                    <AntDesign name="reload1" size={14} color="#7B8CDE" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => this.setState({ rateFlip: !this.state.rateFlip })}>
                                    <Text style={styles.rateText}>{quoting ? '...' : this.rateText()}</Text>
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.feeText}>{lan.t('swap.networkFee')} {this.networkFeeText()}</Text>
                        </View>
                        {this.renderDetailRow(lan.t('swap.minReceived'), this.minReceivedText())}
                        {this.renderDetailRow(lan.t('swap.priceImpact'), this.impactText(), { color: this.impactColor() })}
                        {this.renderDetailRow(lan.t('swap.tradingFee'), this.tradingFeeText())}
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>{lan.t('swap.route')}</Text>
                            <View style={styles.routeBox}>
                                {route.map((symbol, index) => (
                                    <View key={symbol + index} style={styles.routeItem}>
                                        {index > 0 ? <Text style={styles.routeArrow}>›</Text> : null}
                                        <View style={styles.routeChip}>
                                            <Text style={styles.routeChipText}>{symbol}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>
                    <View style={{ height: p(40) }} />
                </ScrollView>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    page: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    banner: {
        marginHorizontal: p(30),
        marginBottom: p(10),
        backgroundColor: '#FFF6E8',
        borderRadius: p(12),
        padding: p(16),
    },
    bannerText: {
        color: '#C47B00',
        fontSize: p(24),
    },
    card: {
        marginHorizontal: p(30),
        backgroundColor: '#F5F6F8',
        borderRadius: p(16),
        padding: p(20),
    },
    fromCard: {
        marginTop: p(36),
    },
    fromBody: {
        marginTop: p(36),
    },
    cardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardLabel: {
        fontSize: p(24),
        color: '#9FA0A3',
    },
    balanceText: {
        fontSize: p(22),
        color: '#565555',
    },
    cardBody: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: p(16),
    },
    tokenBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: p(30),
        paddingHorizontal: p(14),
        paddingVertical: p(8),
    },
    tokenIcon: {
        width: p(44),
        height: p(44),
    },
    tokenSymbol: {
        fontSize: p(30),
        color: '#0D1C3D',
        fontWeight: '600',
        marginHorizontal: p(8),
    },
    amountInput: {
        flex: 1,
        textAlign: 'right',
        fontSize: p(40),
        color: '#0D1C3D',
        fontWeight: '600',
        padding: 0,
    },
    estimate: {
        flex: 1,
        textAlign: 'right',
        fontSize: p(40),
        color: '#0D1C3D',
        fontWeight: '600',
    },
    estimateHint: {
        marginTop: p(8),
        marginRight: p(40),
        textAlign: 'right',
        color: '#9FA0A3',
        fontSize: p(22),
    },
    flip: {
        alignSelf: 'center',
        marginVertical: p(12),
        width: p(64),
        height: p(64),
        borderRadius: p(32),
        backgroundColor: '#F5F6F8',
        alignItems: 'center',
        justifyContent: 'center',
    },
    slipHead: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: p(28),
        marginHorizontal: p(30),
    },
    slipPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF3FF',
        borderRadius: p(24),
        paddingHorizontal: p(16),
        paddingVertical: p(8),
    },
    slipPillText: {
        color: '#3D4FBF',
        fontSize: p(24),
        fontWeight: '600',
    },
    slipRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: p(16),
        marginHorizontal: p(30),
    },
    slipLabel: {
        fontSize: p(26),
        color: '#565555',
        marginRight: p(16),
    },
    slipOn: {
        backgroundColor: '#0D1C3D',
        borderRadius: p(20),
        paddingHorizontal: p(18),
        paddingVertical: p(8),
        marginRight: p(12),
    },
    slipOff: {
        backgroundColor: '#F5F6F8',
        borderRadius: p(20),
        paddingHorizontal: p(18),
        paddingVertical: p(8),
        marginRight: p(12),
    },
    slipOnText: {
        color: '#FFFFFF',
        fontSize: p(24),
    },
    slipOffText: {
        color: '#565555',
        fontSize: p(24),
    },
    detailCard: {
        marginTop: p(24),
        marginHorizontal: p(30),
        backgroundColor: '#FFFFFF',
        borderRadius: p(16),
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: '#EEEEEE',
        paddingHorizontal: p(20),
        paddingVertical: p(8),
    },
    rateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: p(16),
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#F0F0F0',
    },
    rateLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: p(10),
    },
    rateText: {
        marginLeft: p(8),
        fontSize: p(22),
        color: '#3D4FBF',
        fontWeight: '500',
    },
    feeText: {
        fontSize: p(20),
        color: '#9FA0A3',
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: p(16),
    },
    detailLabel: {
        fontSize: p(24),
        color: '#8E97B8',
    },
    detailValue: {
        fontSize: p(26),
        color: '#0D1C3D',
        fontWeight: '500',
    },
    routeBox: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    routeItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    routeArrow: {
        marginHorizontal: p(6),
        color: '#9FA0A3',
        fontSize: p(24),
    },
    routeChip: {
        backgroundColor: '#EEF1FF',
        borderRadius: p(16),
        paddingHorizontal: p(12),
        paddingVertical: p(6),
    },
    routeChipText: {
        color: '#3D4FBF',
        fontSize: p(22),
        fontWeight: '600',
    },
    submit: {
        marginTop: p(24),
        marginHorizontal: p(30),
        height: p(88),
        borderRadius: p(16),
        backgroundColor: '#FFD24C',
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitText: {
        fontSize: p(32),
        color: '#0D1C3D',
        fontWeight: '600',
    },
    sheet: {
        backgroundColor: '#FFFFFF',
        paddingBottom: Platform.OS === 'ios' ? p(40) : p(20),
        borderTopLeftRadius: p(20),
        borderTopRightRadius: p(20),
    },
    sheetRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: p(30),
        height: p(120),
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#EEEEEE',
    },
    sheetIcon: {
        width: p(64),
        height: p(64),
    },
    sheetInfo: {
        flex: 1,
        marginLeft: p(16),
    },
    sheetNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sheetText: {
        fontSize: p(30),
        color: '#0D1C3D',
        fontWeight: '600',
    },
    sheetAddr: {
        marginTop: p(6),
        fontSize: p(22),
        color: '#9FA0A3',
    },
    sheetBal: {
        fontSize: p(28),
        color: '#0D1C3D',
        fontWeight: '500',
    },
    pwdBox: {
        width: WIDTH - p(150),
        backgroundColor: '#FFFFFF',
        borderRadius: p(12),
        alignItems: 'center',
    },
    pwdTitle: {
        fontSize: p(30),
        color: '#585757',
        fontWeight: '500',
        marginTop: p(30),
    },
    pwdInput: {
        width: WIDTH - p(210),
        height: p(80),
        borderWidth: 1,
        borderColor: '#E7E7E7',
        borderRadius: p(10),
        marginTop: p(24),
        paddingHorizontal: p(16),
        fontSize: p(28),
        color: '#0D1C3D',
    },
    pwdActions: {
        flexDirection: 'row',
        marginTop: p(24),
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#E7E7E7',
    },
    pwdBtn: {
        flex: 1,
        height: p(90),
        alignItems: 'center',
        justifyContent: 'center',
    },
    pwdSplit: {
        width: StyleSheet.hairlineWidth,
        backgroundColor: '#E7E7E7',
    },
    pwdCancel: {
        fontSize: p(30),
        color: '#605f5f',
    },
    pwdOk: {
        fontSize: p(30),
        color: '#cda325',
    },
});
