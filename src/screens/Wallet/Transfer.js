/**
 * Created by zh. on 2019/09/01.
 */

import React, {Component} from 'react';
import {
    StyleSheet,
    View,
    Text, TouchableOpacity,  Image
} from 'react-native' ;
import {Input, Slider} from "react-native-elements";
import AntDesign from "react-native-vector-icons/AntDesign";
import {Overlay} from "teaset";

import {tokenAbi} from '../../blockchain/contract/TokenContract';
import LinearGradient from "react-native-linear-gradient";
import Web3 from "web3";
import {Images} from "../../resource";
import {TOKEN_LIST} from '../../blockchain/TokenInfo';
import {Button} from '../../common/Button';
import {Head} from '../../common/Head';
import Entypo from 'react-native-vector-icons/Entypo';
import commonStyles from "../../styles/commonStyles";
export default class Transfer extends Component {
    constructor(props) {
        super(props);
    }
    static navigationOptions =  ({ navigation }) =>({
        //headerTitle: navigation.state.params.item.symbol + lan.t('tt.transferTran')
        header: null
    });
    // 状态
    state = {
        useChainInfo:null,
        toAddress:'',
        handGas: false,
        tokenInfo:null,
        sliderValue:1,
        sliderIndex:1,
        gasLevels:[1,1,1],
        fee:0,
        trxEnergy:0,
        trxBandwidth:0,
        walletPassword:null,
        ETH_ETH:'0.000000',
        tokenBalance:0,
        gasLimit: 70000,
        tokenList:[],
        addressBookList:[]
    };

    componentDidMount(){
        let tokenList =  TOKEN_LIST[useChainInfo.chainSymbol];
        const { params } = this.props.navigation.state;
        this.setState({
            tokenInfo:params.item,
            useChainInfo:params.useChainInfo,
            toAddress:params.toAddress,
            tokenList:tokenList
        })
        this.getAllBalance(params.item);
        this.getGasPrice(params.useChainInfo,params.item);
        if(params.item.symbol == params.useChainInfo.chainSymbol){
            this.setState({
                gasLimit: 21000
            })
        }else{
            this.setState({
                gasLimit: 70000
            })
        }
        //获取地址列表
        storage.load({
            key: 'AddressBookList'
        }).then(data => {
            this.setState({
                addressBookList: data
            })
        }).catch(e=>{
        })
    }
    getAllBalance(tokenInfo){
        const chain = (this.state.useChainInfo || useChainInfo || {}).chainSymbol;
        const done = (data) => {
            if(data === undefined || data === null) return;
            this.setState({ tokenBalance: data });
        };
        if(chain === 'TRX'){
            const req = (!tokenInfo || !tokenInfo.address || tokenInfo.symbol === 'TRX')
                ? BlockChainService.getTrxBalance(walletAddress)
                : BlockChainService.getTrxTokenBalance(walletAddress, tokenInfo.address, tokenInfo.decimals);
            req.then(done).catch(() => {
                const key = 'TRX_' + walletAddress + '_' + (tokenInfo && tokenInfo.symbol);
                done(global[key] || 0);
            });
            return;
        }
        BlockChainService.getAllBalance(walletAddress,tokenInfo).then(done).catch(() => {
            const key = chain + '_' + walletAddress + '_' + (tokenInfo && tokenInfo.symbol);
            done(global[key] || 0);
        });
    }
    setAll(){
        let {tokenBalance,fee,tokenInfo,useChainInfo} = this.state;
        const key = useChainInfo.chainSymbol + '_' + walletAddress + '_' + tokenInfo.symbol;
        let bal = parseFloat(tokenBalance);
        if(!bal || bal <= 0){
            bal = parseFloat(global[key] || 0);
        }
        if(tokenInfo.symbol == useChainInfo.chainSymbol && bal > parseFloat(fee || 0)){
            this.setState({
                amount: (bal - parseFloat(fee || 0)) + "",
                tokenBalance: bal
            })
        }else{
            this.setState({
                amount: bal + "",
                tokenBalance: bal
            })
        }
    }
    getGasPrice(useChainInfo,tokenInfo){
        if(useChainInfo.chainSymbol == 'TRX'){
            const applyTrxFee = (r) => {
                const feeLimit = r.feeLimit || (tokenInfo.symbol == 'TRX' ? 1 : 15);
                const fee = r.fee != null ? r.fee : feeLimit;
                this.setState({
                    fee,
                    trxFeeEstimate: fee,
                    trxEnergy: r.energy || 0,
                    trxBandwidth: r.bandwidth || 0,
                    sliderValue: feeLimit,
                    sliderIndex: 1,
                    gasLevels: [
                        Math.max(1, Math.round(feeLimit * 0.7)),
                        feeLimit,
                        Math.max(feeLimit + 5, Math.round(feeLimit * 1.5)),
                    ],
                });
            };
            BlockChainService.estimateTrxTransferFee(walletAddress, tokenInfo)
                .then(applyTrxFee)
                .catch(() => applyTrxFee({
                    fee: tokenInfo.symbol == 'TRX' ? 0 : 15,
                    feeLimit: tokenInfo.symbol == 'TRX' ? 1 : 15,
                }));
            return;
        }
        if(useChainInfo.chainSymbol != 'ETH' && useChainInfo.chainSymbol !== 'BNB') return;
        const isBnb = useChainInfo.chainSymbol === 'BNB';
        const fallback = isBnb ? (global.BnbGwei || 1) : (global.EthGwei || 10);
        const roundGwei = (v) => isBnb
            ? Math.max(0.05, Math.round(v * 100) / 100)
            : Math.max(1, Math.round(v));
        const applyGwei = (gwei) => {
            const avg = roundGwei(gwei);
            const slow = roundGwei(avg * 0.8);
            const fast = roundGwei(avg * 1.5);
            const gasLevels = [slow, avg, fast];
            if (isBnb) global.BnbGwei = avg;
            else global.EthGwei = avg;
            this.setState({
                gasLevels,
                sliderIndex: 1,
                sliderValue: avg,
            }, () => this.calculationFee(avg));
        };
        BlockChainService.getGasPrice().then(applyGwei).catch(() => applyGwei(fallback));
    }
    onGasLevelChange(index){
        const i = Math.round(index);
        const gwei = (this.state.gasLevels && this.state.gasLevels[i]) || this.state.sliderValue;
        this.setState({ sliderIndex: i }, () => this.calculationFee(gwei));
    }
    //计算矿工费
    calculationFee(gasPrice){
        let {gasLimit,useChainInfo,trxFeeEstimate} = this.state;
        if(useChainInfo.chainSymbol == 'TRX'){
            this.setState({
                fee: trxFeeEstimate != null ? trxFeeEstimate : gasPrice,
                sliderValue:gasPrice,
                gasPrice: gasPrice
            })
        }else{
            if(parseFloat(gasLimit) && parseFloat(gasPrice)){
                let gwei = gasPrice * Math.pow(10,9);
                let fee = (gwei * gasLimit)/ Math.pow(10,18);
                this.setState({
                    fee:fee,
                    sliderValue:gasPrice,
                    gasPrice: gasPrice
                })
            }
        }

    }
    setGasPrice(value){
       this.setState({
           gasPrice: value
       },()=>{
           this.calculationFee(value)
       })
    }
    setGasLimit(value){
        let {gasPrice} = this.state;
        this.setState({
            gasLimit: value
        },()=>{
            this.calculationFee(gasPrice)
        })
    }
    //查询交易是否成功
    getTransactionReceipt(hash){
        this.timerHash = setInterval(()=>{
            if(useChainInfo.chainSymbol == 'TRX'){
                this.getTrxHash(hash);
            }else{
                this.getHash(hash);
            }
        },1000);
    }
    getTrxHash(hash){
        TronWeb.trx.getConfirmedTransaction(hash).then(res => {
            if (res && res.ret[0].contractRet === "SUCCESS") {
                this.timerHash && clearInterval(this.timerHash);
                Toast.success(lan.t('tran.tranSuccess'))
            }
        })
    }
    getHash(hash){
        BlockChainService.getTransactionReceipt(hash).then(data => {
            if(data){
                this.timerHash && clearInterval(this.timerHash);
                if(data === '0x1' || data === 1){
                    Toast.success(lan.t('tran.tranSuccess'))
                }else{
                    Toast.info(lan.t('tran.tranFail'))
                }
            }
        })
    }
    //转账
    transferButton(){
        const {amount,toAddress,tokenInfo,fee,useChainInfo,tokenBalance,sliderValue,gasLimit} = this.state;
        const mainKey = useChainInfo.chainSymbol + "_" + walletAddress + "_" + useChainInfo.chainSymbol;
        let mainBalance = parseFloat(global[mainKey] || 0);
        if(!amount || parseFloat(amount) <= 0){
            Toast.info(lan.t('tt.enterNumber'));
            return
        }
        if(!toAddress){
            Toast.info(lan.t('tt.enterAddress'));
            return
        }
        let gasFee = parseFloat(fee) || 0;
        if(useChainInfo.chainSymbol !== 'TRX' && gasFee <= 0 && sliderValue && gasLimit){
            gasFee = (parseFloat(sliderValue) * Math.pow(10,9) * parseFloat(gasLimit)) / Math.pow(10,18);
        }
        if(mainBalance < gasFee){
            Toast.info(lan.t('tran.minerNoFee'));
            return
        }
        if(tokenInfo.symbol == useChainInfo.chainSymbol){
            let totalAmount = parseFloat(amount) + gasFee;
            if(mainBalance < totalAmount){
                Toast.info(tokenInfo.symbol+lan.t('tt.noBalance'));
                return
            }
        }else {
            if(parseFloat(tokenBalance) < parseFloat(amount)){
                Toast.info(tokenInfo.symbol+lan.t('tt.noBalance'));
                return
            }
        }
        this.walletPasswordPull()
    }
    //波场链转账
    transferTronChain(){
        const {tokenInfo,toAddress,amount,sliderValue,useChainInfo} = this.state;
        if(toAddress.length!=34){
            Toast.info(lan.t('tt.errorAddress'));
            return
        }
        if(tokenInfo.symbol == useChainInfo.chainSymbol){
            BlockChainService.transferTronTransaction(toAddress,sliderValue,amount).then(data => {
                if (data.txid) {
                    this.getTransactionReceipt(data.txid);
                    Toast.success(tokenInfo.symbol + lan.t('tt.tranSuccess'));
                    this.setState({
                        amount:'',
                        toAddress:''
                    })
                }else{
                    Toast.info(tokenInfo.symbol + lan.t('tt.tranFailure'))
                }
            })
        }else{
            let value = amount * Math.pow(10,tokenInfo.decimals);
            //代币转账交易
            let parameter = [
                {
                    type:'address',
                    value:toAddress
                },
                {
                    type:'uint256',
                    value: value
                }
            ]
            let functionName = "transfer(address,uint256)";
            BlockChainService.singTronTransactionBroadcast(tokenInfo.address,functionName,parameter,sliderValue,0).then(data => {
                if (data.txid) {
                    this.getTransactionReceipt(data.txid);
                    Toast.success(tokenInfo.symbol + lan.t('tt.tranSuccess'));
                    this.setState({
                        amount:'',
                        toAddress:''
                    })
                }else{
                    Toast.info(tokenInfo.symbol + lan.t('tt.tranFailure'))
                }
            })
        }
    }
    //ETH类公链转账
    transferEthChain(){
        const {tokenInfo,toAddress,amount,sliderValue,useChainInfo,gasLimit} = this.state;
        if(toAddress.length!=42){
            Toast.info(lan.t('tt.errorAddress'));
            return
        }
        let that = this;

        Loading.show(lan.t('tt.chainTran'));
        if(tokenInfo.symbol == useChainInfo.chainSymbol){
            Loading.hide()
            BlockChainService.transferTransaction('',toAddress,gasLimit,sliderValue,amount).then(data => {
                if (data) {
                    this.getTransactionReceipt(data);
                    Toast.success(tokenInfo.symbol + lan.t('tt.tranSuccess'));
                    that.setState({
                        amount:'',
                        toAddress:''
                    })
                }else{
                    Toast.info(tokenInfo.symbol + lan.t('tt.tranFailure'))
                }
            })
        }else{
            //代币转账交易
            let chainWeb3 =  new Web3(new Web3.providers.HttpProvider(useChainInfo.chainUrl))
            let value = amount * Math.pow(10,tokenInfo.decimals);
            let tokenInstance = chainWeb3.eth.contract(tokenAbi);
            let tokenContract = tokenInstance.at(tokenInfo.address);
            let data = tokenContract.transfer.getData(toAddress,chainWeb3.toHex(value));
            BlockChainService.transferTransaction(data,tokenInfo.address,gasLimit,sliderValue,0).then(data => {
                Loading.hide()
                if (data) {
                    this.getTransactionReceipt(data);
                    Toast.success(tokenInfo.symbol + lan.t('tt.tranSuccess'));
                    this.setState({
                        amount:'',
                        toAddress:''
                    })
                }else{
                    Toast.info(tokenInfo.symbol + lan.t('tt.tranFailure'))
                }
            })
        }
    }
    //转账交易
    fromTransfer(){
        const {password,useChainInfo} = this.state;
        if(password !== walletPassword){
            Toast.info(lan.t('wallet.passwordError'));
        }else{
            this.overlayWalletPasswordPull.close();
            if(useChainInfo.chainSymbol == 'TRX'){
                this.transferTronChain();
            }else{
                this.transferEthChain();
            }
        }
    }
    setTokenInfo(item,overlayNetPullView){
        overlayNetPullView.close();
        this.setState({
            tokenInfo:item,
            amount:''
        })
        this.getAllBalance(item);
        if(item.symbol == useChainInfo.chainSymbol){
            this.setState({
                gasLimit: 21000
            })
        }else{
            this.setState({
                gasLimit: 90000
            })
        }

    }
    useAddressBook(item){
        this.setState({
            toAddress:item.walletAddress
        })
    }
    walletPasswordPull(){
        let overlayView = (
            <Overlay.PopView
                ref={v => this.overlayWalletPasswordPull = v}
                style={{alignItems: 'center', justifyContent: 'center'}}
            >
                <View style={{backgroundColor: Theme.backgroundColor, width: WIDTH-p(150), borderRadius: p(10)}}>
                    <View  style={{alignItems: 'center', justifyContent: 'center'}}>
                        <View style={{alignItems:'center', justifyContent: 'center',height:p(120)}}>
                            <Text style={{fontSize: p(30),color:'#585757',fontWeight:'500'}}>
                                {lan.t('pay.zhifuqueren')}
                            </Text>
                        </View>
                            <View style={{width:WIDTH-p(180)}}>
                                <Input
                                    placeholder= {lan.t('pay.qingshurqianbaomima')}
                                    secureTextEntry={true}
                                    labelStyle={{
                                        color:'#292929',
                                        fontSize:p(26),
                                        margin:p(10),
                                    }}
                                    inputStyle={{fontSize:p(30),marginLeft:p(20)}}
                                    inputContainerStyle={{borderColor:'#E7E7E7',borderWidth:p(1),borderRadius:p(10)}}
                                    onChangeText={(password) => this.setState({password})}
                                />
                            </View>
                            <Text style={{color: Theme.cancelColor,fontSize:p(24),left:-p(50),marginTop:p(20)}}>
                                {lan.t('pay.anquanmima')}
                            </Text>

                        <View style={{height:p(1),width:WIDTH-p(150),backgroundColor:'#E7E7E7',marginTop:p(60)}}/>

                        <View style={{width:WIDTH/2,alignItems: 'center',flexDirection:'row',justifyContent:'space-between'}}>
                            <TouchableOpacity
                                onPress={()=>this.overlayWalletPasswordPull.close()}
                                >
                                <Text style={{color: Theme.cancelColor,fontSize:p(30)}}>
                                    {lan.t('all.cancel')}
                                </Text>
                            </TouchableOpacity>
                            <View style={{height:p(100),width: p(1),backgroundColor:'#E7E7E7'}}/>
                            <TouchableOpacity
                                onPress={()=>this.fromTransfer()}
                                style={{}}>
                                <Text style={{color: Theme.appColor,fontSize:p(30)}}>
                                    {lan.t('all.confirm')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Overlay.PopView>
        );
        Overlay.show(overlayView);
    }
    showPull(side, modal, text, rootTransform) {
        let {tokenInfo,useChainInfo} = this.state
        let overlayView = (
            <Overlay.PullView side={side} modal={modal} rootTransform={rootTransform} ref={v => this.overlayPullView = v}>
                <View style={{backgroundColor: '#FFF', minHeight: p(800)}}>

                    <View style={{alignItems:'center',justifyContent:'space-between',flexDirection:'row',
                        height:p(80),backgroundColor:themeColor}}>
                        <Text></Text>
                        <Text style={{color:'#FFF',fontSize:p(32)}}>
                            {lan.t('tt.tranConf')}
                        </Text>
                        <TouchableOpacity
                            style={{marginRight:p(20)}}
                            onPress={() => this.overlayPullView && this.overlayPullView.close()}>
                            <Text style={{color:'#FFF',fontSize:p(32)}}>X</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{marginTop:p(20),marginLeft:p(20)}}>
                        <Text style={styles.Text_06}>
                            {lan.t('tt.chainName')}：{useChainInfo.chainName} ({useChainInfo.chainSymbol})
                        </Text>
                        <Text style={styles.Text_06}>
                            {lan.t('tt.receiverAddress')}：{this.state.toAddress.substring(0,10)}...{this.state.toAddress.substring(30)}
                        </Text>
                        <Text style={styles.Text_06}>
                            {lan.t('tt.tranNumber')}：{this.state.amount} {tokenInfo.symbol}
                        </Text>
                    </View>

                    <Input
                        secureTextEntry={true}
                        labelStyle={{color:'#292929',marginBottom:p(20),marginTop:p(50),fontSize:p(26)}}
                        label={lan.t('wallet.enterPassword')}
                        placeholder={lan.t('wallet.enterPassword')}
                        leftIcon={
                            <AntDesign
                                name='key'
                                size={24}
                                color='#5f5f5f'
                                style={{left:-p(20)}}
                            />
                        }
                        onChangeText={(password) => this.setState({password})}
                    />

                    <View style={{justifyContent:'center',alignItems:'center',marginTop: p(80)}} >
                        <TouchableOpacity onPress={()=>this.fromTransfer()}>
                            <LinearGradient
                                start={{x: 0.25, y: 0.25}}
                                end={{x: 0.75, y: 0.75}}
                                colors={['#305b96', '#224c86', '#1e3560']}
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
        Overlay.show(overlayView);
    }
    getImage(symbol){
        if(Images.token[symbol]){
            return (
                <Image resizeMode="stretch" style={styles.Image_01} source={Images.token[symbol]}/>
            )
        }else{
            return (
                <View style={{height:p(55),width:p(55),borderRadius:p(100),
                    backgroundColor: '#929191',justifyContent:'center',alignItems:'center',marginRight:p(10)}}>
                    <Text style={{fontSize:p(16),color:'#ffffff'}}>
                        {symbol}
                    </Text>
                </View>
            )
        }
    }
    showTokenPull() {
        let {tokenList} = this.state;
        let overlayView = (
            <Overlay.PullView
                ref={v => this.overlayNetPullView = v}
            >
                <View style={{width:WIDTH,backgroundColor: '#FFF'}}>
                    <View style={{}}>
                        <View style={{flexDirection:'row',justifyContent:'center',marginTop:p(30),alignItems:'center'
                            ,marginBottom:p(30)}}>
                            <Text style={{color: '#333333',fontSize:p(30)}}>
                                {lan.t('news.daibixuanzhe')}
                            </Text>
                        </View>
                        <View style={{height:p(20),width:WIDTH,backgroundColor:'#f5f3f3'}}/>
                        <View>
                            {
                                tokenList.map((item,index)=>{
                                    return(
                                        <TouchableOpacity
                                            onPress={()=>this.setTokenInfo(item,this.overlayNetPullView)}
                                            style={styles.linearGradient2} key={index}>
                                            <View style={{marginLeft:p(30),justifyContent:'space-between',flexDirection:'row',
                                            alignItems:'center',width:WIDTH-p(100),marginTop:p(20),marginBottom:p(20)}}>
                                                <View style={{flexDirection: 'row',alignItems:'center'}}>
                                                    <Image style={{width:p(50),height:p(50),marginRight: p(15)}}
                                                           source={Images.token[item.symbol]}/>
                                                    <Text style={{color: '#333333',fontWeight:'500',fontSize:p(32)}}>
                                                        {item.symbol}
                                                    </Text>
                                                </View>
                                                <Text style={{fontSize:p(30),color: '#333333',fontWeight:'500'}}>
                                                    { global[useChainInfo.chainSymbol+"_"+walletAddress+"_"+item.symbol]?
                                                        global[useChainInfo.chainSymbol+"_"+walletAddress+"_"+item.symbol]
                                                        :'0.0000'}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    )
                                })
                            }
                        </View>
                        <View style={{height:p(20),width:WIDTH,backgroundColor:'#f5f3f3'}}/>
                        <TouchableOpacity
                            onPress={() => this.overlayNetPullView && this.overlayNetPullView.close()}
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

    showAddressBookPull() {
        let {addressBookList} = this.state;
        let overlayView = (
            <Overlay.PullView
                ref={v => this.overlayAddressBookPull = v}
            >
                <View style={{width:WIDTH,backgroundColor: '#FFF'}}>
                    <View style={{}}>
                        <View style={{justifyContent:'center',alignItems:'center',height:p(90)
                            ,borderBottomColor:'#f5f3f3',borderBottomWidth:p(1),flexDirection:'row'}}>
                            <Text style={{color:'#333333',fontSize:p(28),marginLeft:p(10)}}>
                                {lan.t('news.dizhibu')}
                            </Text>
                        </View>
                        <View>
                            {
                                addressBookList && addressBookList.map((item,index)=>{
                                    return(
                                        <TouchableOpacity
                                            onPress={()=>this.overlayAddressBookPull.close() && this.useAddressBook(item)}
                                            style={styles.linearGradient2} key={index}>
                                            <View style={{marginRight:p(20),marginLeft:p(20),
                                                marginTop:p(20),marginBottom:p(20)}}>
                                                <Text style={{color:'#333333',fontSize:p(26),fontWeight:'500'}}>
                                                    {item.walletName}
                                                </Text>
                                                <Text style={{color:'#373535',fontSize:p(26),marginTop:p(20)}}>
                                                    {item.walletAddress}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    )
                                })
                            }
                        </View>
                        <View style={{height:p(20),width:WIDTH,backgroundColor:'#f5f3f3'}}/>
                        <TouchableOpacity
                            onPress={() => this.overlayAddressBookPull.close()}
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
    // 渲染
    render() {
        const {tokenInfo,useChainInfo,sliderValue,sliderIndex,gasPrice,gasLimit,handGas} = this.state;
        if(tokenInfo){
            return (
                <View style={{ flex: 1, backgroundColor: Theme.backgroundColor }}>

                    <Head
                        text={lan.t('tt.transfer')}
                        leftOnPress={()=>this.props.navigation.goBack()}
                    />

                    <View style={{justifyContent:'center',alignItems:'center',marginBottom: p(150)}}>
                        <View style={{width:WIDTH-p(30)}}>
                            <View style={{flexDirection:'row',alignItems:'center'}}>
                                <Text style={commonStyles.inputTitle}>
                                    {lan.t('tt.coinToken')}：
                                </Text>
                                <View style={{flexDirection: 'row',alignItems: 'center',marginTop: p(26)}}>
                                    {
                                        this.getImage(tokenInfo.symbol)
                                    }
                                    <Text style={{fontSize:p(28),color: '#363636',marginLeft:p(10),fontWeight:'500'}}>
                                        {tokenInfo.symbol}
                                    </Text>
                                    <TouchableOpacity onPress={()=>this.showTokenPull()}>
                                        <AntDesign
                                          name='menuunfold'
                                          size={17}
                                          color={Theme.appColor}
                                          style={{marginLeft: WIDTH-p(350)}}
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <Text style={commonStyles.inputTitle}>
                                {lan.t('tt.tranNumber')}
                                <Text style={{color: '#939393',fontSize:p(26),
                                marginTop:p(26),}}>
                                    ({lan.t('pcd.qbye')}：
                                { global[useChainInfo.chainSymbol+"_"+walletAddress+"_"+tokenInfo.symbol]?
                                  global[useChainInfo.chainSymbol+"_"+walletAddress+"_"+tokenInfo.symbol]
                                  :'0.0000'})
                                </Text>
                            </Text>

                            <View style={styles.ViewSty1}>
                                <Input
                                  placeholder={lan.t('news.tianxiezhuanzhuangshuliang')}
                                  value = {this.state.amount}
                                  inputStyle={{color: Theme.textColor,fontSize:p(24)}}
                                  inputContainerStyle={commonStyles.inputContainer}
                                  onChangeText={(amount) => this.setState({amount})}
                                  rightIcon={
                                      <TouchableOpacity
                                        onPress={()=>this.setAll()}
                                        style={styles.TouchableSty2}>
                                          <Text style={{fontSize:p(22),color: Theme.textColor}}>
                                              {lan.t('news.quanbu')}
                                          </Text>
                                      </TouchableOpacity>
                                  }
                                />
                            </View>


                            <View style={{flexDirection:'row',alignItems:'center'}}>

                                <Text style={commonStyles.inputTitle}>
                                    {lan.t('tt.receiverAddress')}
                                </Text>
                                <TouchableOpacity
                                  style={{marginLeft: p(30),marginTop:p(30),flexDirection:'row',alignItems:'center'}}
                                  onPress={()=>this.showAddressBookPull()}>
                                    <Text style={{color: Theme.appColor,fontSize: p(26)}}>
                                        {lan.t('nana.xuanzeqianbao')}
                                    </Text>
                                    <Entypo
                                      name='chevron-small-right'
                                      size={16}
                                      color={Theme.appColor}
                                      style={{marginTop:p(4)}}
                                    />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.ViewSty1}>
                                <Input
                                  placeholder={lan.t('news.tianxieshoukuangdizhi')}
                                  value = {this.state.toAddress}
                                  inputStyle={{color: Theme.textColor,fontSize:p(24)}}
                                  inputContainerStyle={commonStyles.inputContainer}
                                  onChangeText={(toAddress) => this.setState({toAddress})}
                                />
                            </View>
                            <View style={{marginBottom: p(10)}}>
                                <View style={{flexDirection: 'row',alignItems: 'center',flexWrap:'wrap'}}>
                                    <Text style={commonStyles.inputTitle}>{lan.t('tt.minerFee')}：</Text>
                                    <Text style={[styles.Text_03,{marginTop:p(30)}]}>
                                        ≈ {Number(this.state.fee).toFixed(useChainInfo.chainSymbol === 'TRX' ? 6 : 8)} {useChainInfo.chainSymbol === 'TRX' ? 'TRX' : useChainInfo.chainSymbol}
                                    </Text>
                                </View>
                                {useChainInfo.chainSymbol === 'TRX' ? (
                                    <View style={{marginLeft:p(15),marginTop:p(8)}}>
                                        <Text style={[styles.Text_03,{color:'#939393'}]}>
                                            能量 {this.state.trxEnergy || 0}  |  带宽 {this.state.trxBandwidth || 0}
                                        </Text>
                                        {tokenInfo.symbol !== 'TRX' && Number(this.state.fee) > 0 ? (
                                            <Text style={[styles.Text_03,{color: Theme.appColor,marginTop:p(6)}]}>
                                                能量不足，将燃烧 TRX 支付
                                            </Text>
                                        ) : null}
                                        {tokenInfo.symbol !== 'TRX' && Number(this.state.fee) <= 0 ? (
                                            <Text style={[styles.Text_03,{color:'#939393',marginTop:p(6)}]}>
                                                能量足够，不额外扣 TRX
                                            </Text>
                                        ) : null}
                                    </View>
                                ) : null}
                            </View>

                            {
                                useChainInfo.chainSymbol === 'TRX' ? null :
                                !handGas?
                                  <View style={{backgroundColor: '#F5F6F8',borderRadius: p(20),width: WIDTH-p(60),
                                      marginLeft: p(15)}}>
                                      <View style={{marginLeft: p(20),marginTop: p(30),marginBottom: p(20)}}>
                                          <View style={{flexDirection: 'row',justifyContent: 'space-between',alignItems: 'center'}}>
                                              <Text style={styles.Text_03}>Gas Price: {sliderValue} Gwei</Text>
                                              <TouchableOpacity
                                                onPress={()=>this.setState({
                                                    handGas:!handGas
                                                })}>
                                                  <Text style={{fontSize: p(26),color: Theme.appColor,marginRight: p(20)}}>
                                                      {!handGas?lan.t('news.shoudongtiaojie'):lan.t('all.back')}
                                                  </Text>
                                              </TouchableOpacity>
                                          </View>
                                          <Slider
                                            style={{width:WIDTH-p(100),marginTop:p(10)}}
                                            maximumTrackTintColor={'#d2d2d2'}
                                            minimumTrackTintColor={Theme.appColor}
                                            thumbTintColor={Theme.appColor}
                                            thumbStyle={{width:p(28),height:p(28),borderRadius:p(14)}}
                                            trackStyle={{height:p(6),borderRadius:p(3)}}
                                            step={1}
                                            minimumValue={0}
                                            maximumValue={2}
                                            value={sliderIndex}
                                            onValueChange={v => this.onGasLevelChange(v)}
                                          />
                                          <View style={styles.View_03}>
                                              <TouchableOpacity onPress={()=>this.onGasLevelChange(0)}>
                                                  <Text style={[styles.Text_03, sliderIndex===0 && styles.Text_gasActive]}>{lan.t('tt.slow')}</Text>
                                              </TouchableOpacity>
                                              <TouchableOpacity onPress={()=>this.onGasLevelChange(1)}>
                                                  <Text style={[styles.Text_03, sliderIndex===1 && styles.Text_gasActive]}>{lan.t('tt.average')}(≈3s)</Text>
                                              </TouchableOpacity>
                                              <TouchableOpacity onPress={()=>this.onGasLevelChange(2)}>
                                                  <Text style={[styles.Text_03, sliderIndex===2 && styles.Text_gasActive]}>{lan.t('tt.fast')}</Text>
                                              </TouchableOpacity>
                                          </View>
                                      </View>
                                  </View>
                                  :
                                  <View style={{backgroundColor: '#F5F6F8',borderRadius:p(20),width: WIDTH-p(60),
                                      marginLeft: p(15)}}>
                                      <View style={{marginTop:p(30),flexDirection: 'row',justifyContent: 'space-between',alignItems: 'center'}}>
                                          <Text style={{fontSize: p(24),color: Theme.textColor,marginLeft:p(20)}}>
                                              {lan.t('news.zidingyikuangongfei')}
                                          </Text>
                                          <TouchableOpacity
                                            onPress={()=>this.setState({
                                                handGas:!handGas
                                            })}>
                                              <Text style={{fontSize: p(26),color: Theme.appColor,marginRight: p(20)}}>
                                                  {!handGas?lan.t('news.shoudongtiaojie'):lan.t('all.back')}
                                              </Text>
                                          </TouchableOpacity>
                                      </View>
                                      <View style={{marginTop:p(30),flexDirection:'row',justifyContent:'space-between',marginBottom:p(20)}}>
                                          <View>
                                              <Text style={{fontSize: p(22),color:'#363636',marginLeft:p(20)}}>
                                                  Gas Price(Gwei)
                                              </Text>
                                              <View style={{width:WIDTH/3+p(50)}}>
                                                  <Input
                                                    defaultValue={gasPrice+""}
                                                    inputStyle={{fontSize:p(30),textAlign: 'center',textAlignVertical: 'center',backgroundColor:'#FFF'}}
                                                    inputContainerStyle={{borderColor:'#FFF',borderWidth:p(1),borderRadius:p(10)}}
                                                    onChangeText={(gasPrice) => this.setGasPrice(gasPrice)}
                                                  />
                                              </View>
                                          </View>
                                          <View>
                                              <Text style={{fontSize: p(22),color:'#363636',marginLeft:p(20)}}>
                                                  Gas Limit(Gas)
                                              </Text>
                                              <View style={{width:WIDTH/3+p(50)}}>
                                                  <Input
                                                    value={gasLimit+""}
                                                    inputStyle={{fontSize:p(30),textAlign: 'center',textAlignVertical: 'center',backgroundColor:'#FFF'}}
                                                    inputContainerStyle={{borderColor:'#FFF',borderWidth:p(1),borderRadius:p(10)}}
                                                    onChangeText={(gasLimit) => this.setGasLimit(gasLimit)}
                                                  />
                                              </View>
                                          </View>
                                      </View>
                                  </View>
                            }

                        </View>
                    </View>

                    <Button
                        text={ lan.t('all.confirm')}
                        onPress={()=>this.transferButton()}
                    />
                </View>

            )
        }else{
            return (null)
        }
    }
}


const styles = StyleSheet.create({
    linearGradient2: {
        justifyContent:'space-between',
        flexDirection: 'row',
        alignItems:'center',
        borderBottomColor:'#f5f3f3',
        borderBottomWidth:p(10),
    },
    TextSty4:{color:'#FEFEFE',fontWeight:'500',fontSize:p(30)},
    TouchableSty:{
        height: p(90),
        width:WIDTH-p(180),
        backgroundColor: Theme.appColor,
        borderRadius:p(20),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: p(100),
        marginTop:p(20)
    },
    TouchableSty2:{
        width:p(80),
        height:p(50),
        backgroundColor: Theme.buttonStyle,
        alignItems:'center',
        justifyContent:'center',
        borderRadius: p(10),
    },
    ViewSty1:{
        justifyContent:'space-between',
        alignItems:'center',
        flexDirection:'row',
    },
    linearGradient: {
        width: WIDTH-p(180),
        height: p(90),
        borderRadius: p(50),
        justifyContent:'center',
        alignItems:'center'
    },
    Image_01:{
        width:p(45),
        height:p(45),
    },
    backgroundImage:{
        width:WIDTH,
        //不加这句，就是按照屏幕高度自适应
        //加上这几，就是按照屏幕自适应
        //祛除内部元素的白色背景
        backgroundColor:'rgba(0,0,0,0)',
        marginTop:p(20)
    },
    button:{
        width:WIDTH-p(50),
        height:p(70),
        justifyContent:'center',
        alignItems:'center'
    },
    buttonText:{
        color:'#FFF',
        fontSize: p(30),
        lineHeight: p(60)
    },
    View_03:{
        alignItems:'center',
        justifyContent:'space-between',
        width:WIDTH-p(100),
        flexDirection:'row',
        marginBottom: p(30)
    },
    View_02:{
        width:p(150),height:p(50),
        backgroundColor:themeColor,
        borderRadius:p(100),
        alignItems:'center',
        justifyContent:'center'
    },
    View_01:{
        alignItems:'center',
        width:WIDTH-p(80),
        flexDirection:'row',
        marginTop: p(30),
    },
    Text_02:{
        fontSize: p(28),
        color:'#363636',
        lineHeight:p(70),
        fontWeight:'500'
    },
    Text_03:{
        fontSize: p(26),
        color: Theme.textColor,
    },
    Text_gasActive:{
        color: Theme.appColor,
        fontWeight: '600',
    },
    Text_04:{
        fontSize: p(30),
        color:themeColor,
        lineHeight:p(70),
        fontWeight:'500'
    },
    Text_05:{
        fontSize: p(28),
        color:'#FFF',
    },
    Text_06:{
        fontSize: p(28),
        color:'#292929',
        lineHeight:p(65)
    },
});

