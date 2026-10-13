/**
 * Created by zh on 2019/08/08.
 * 用户主界面
 * user main page
 */
import React, { Component } from 'react';
import {
    StatusBar,
    View,
    ImageBackground,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    RefreshControl,
    Clipboard,
    Linking,
    DeviceEventEmitter, Platform,
} from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Entypo from 'react-native-vector-icons/Entypo';
import {Overlay} from "teaset";
import {Images} from "../resource/index";
//公链列表
import {CHAIN_LIST,CHAIN_MAP} from '../blockchain/ChainInfo';
//代币列表
import {
    TOKEN_LIST,
} from '../blockchain/TokenInfo';
import {fetchFhTicker} from '../api/fhMarket';
import { source } from "react-native/Libraries/DeprecatedPropTypes/DeprecatedImagePropType";
import Theme from "../styles/theme";
export default class MainPage extends Component {
  constructor(props) {
    super(props);
  }
  state={
      useChainInfo:{
          chainSymbol:''
      },
      useWalletAddress:null,
      tabs:1,
      modalVisible:false,
      tokenList:[],
      refreshing:false,
      UseWallet:[],
      address:null,
      addTokenList:[]
  }
  componentDidMount() {
      DeviceEventEmitter.addListener("addTokenList", (message) => {
          this.getAddTokenList();
      })
      //切换钱包
      DeviceEventEmitter.addListener("updateUseWallet", (message) => {
          this.getUseWallet();
      })
     //this.getUseWallet();
     this.getUseChain();
     setInterval(()=>{
          let {useChainInfo} = this.state;
          this.getTokenList(useChainInfo);
          this.loadAddTokenBalance();
      },30000);
  }
  //获取自定义代币列表
  getAddTokenList(){
      let key = useChainInfo.chainSymbol+'-AddTokenList';
      storage.load({
          key: key
      }).then(data => {
          this.setState({
              addTokenList:data
          },()=>{
              this.loadAddTokenBalance()
          })
      }).catch(e=>{
          this.setState({
              addTokenList:[]
          })
      })
  }
  getUseChain(){
      //获取公链连接
      storage.load({
          key: 'UseChain'
      }).then(data => {
          this.getLoadChain(data)
      }).catch(e=>{
          this.getLoadChain(CHAIN_LIST[defaultBlockChain])
      })
  }
  //重新加载公链配置
  getLoadChain(useChainInfo){
      let chainInfo = CHAIN_LIST[useChainInfo.chainSymbol];

      global.useChainInfo = chainInfo
      this.setState({
          useChainInfo: chainInfo,
          tokenList: TOKEN_LIST[chainInfo.chainSymbol] || []
      })
      this.getUseWallet(chainInfo);
  }
  //获取公链代币列表
  getTokenList(data){
      let tokenList =  TOKEN_LIST[data.chainSymbol];
      this.setState({
          tokenList: tokenList
      })
      //查询钱包余额
      this.loadBalance(tokenList);
  }

  //切换公链
  setChainInfo(item,overlayNetPullView){
      overlayNetPullView.close();

      global.useChainInfo = item
      DeviceEventEmitter.emit("setChainInfo", item);
      let userWalletInfo = this.state.UseWallet;
      let useWalletAddress = item.chainSymbol == 'TRX'?userWalletInfo.tronAddress:userWalletInfo.address;
      global.walletAddress = useWalletAddress;
      let tokenList = TOKEN_LIST[item.chainSymbol] || [];
      storage.save({
          key: 'UseChain',
          data: item,
      });
      this.setState({
          useWalletAddress:useWalletAddress,
          useChainInfo:item,
          tokenList:tokenList,
          addTokenList:[]
      },()=>{
          this.loadBalance(tokenList);
          this.getAddTokenList();
      })
  }
  getUseWallet(chainInfo){
    //加载当前使用的钱包
    storage.load({
      key: 'UseWallet'
    }).then(data => {
        let useWalletAddress = chainInfo.chainSymbol == 'TRX'?data.tronAddress:data.address;
        global.walletAddress = data.address;
        global.walletPrivateKey = data.privateKey;
        global.walletPassword = data.password;
        global.walletAddress = useWalletAddress;
        this.setState({
            useWalletAddress: useWalletAddress,
            walletName:data.name,
            UseWallet:data
        },()=>{
            this.getTokenList(chainInfo);
            this.getAddTokenList();
        })
    })
  }
  //查询自定义代币余额
  loadAddTokenBalance(){
      let {addTokenList,useWalletAddress} = this.state;
      if(!addTokenList || !addTokenList.length || !useWalletAddress) return;
      const chainSymbol = useChainInfo.chainSymbol;
      addTokenList.forEach((item)=>{
          BlockChainService.getBalance(useWalletAddress,item).then(data => {
              if(data === undefined || data === null) return;
              let key = chainSymbol+"_"+useWalletAddress+"_"+item.symbol;
              global[key] = data;
              this.setState({ [key]: data });
          })
      })
  }
  //查询余额
  loadBalance(tokenData){
      if(!tokenData) return;
      if(useChainInfo.chainSymbol == 'TRX'){
          this.loadTronBalance(tokenData);
      }else{
          this.loadEthBalance(tokenData);
          this.loadAddTokenBalance();
      }
    tokenData.forEach((item)=>{
          this.getTokenPrice(item);
     })
      this.setState({
          ["USDT_Price"]: "1.00",
          ["USDC_Price"]: "1.00",
      });
      global.USDT_Price = 1;
      global.USDC_Price = 1;
  }
    //查询波场链余额
    loadTronBalance(tokenData){
        let {useWalletAddress} = this.state;
        if(!useWalletAddress || !tokenData) return;
        const chainSymbol = useChainInfo.chainSymbol;
        tokenData.forEach((item)=>{
            const req = item.symbol == 'TRX'
                ? BlockChainService.getTrxBalance(useWalletAddress)
                : BlockChainService.getTrxTokenBalance(useWalletAddress, item.address, item.decimals);
            req.then(data => {
                if(data === undefined || data === null) return;
                let key = chainSymbol + "_" + useWalletAddress + "_" + item.symbol;
                global[key] = data;
                this.setState({ [key]: data });
            })
        })
    }
    //查询ETH BSC  链余额
    loadEthBalance(tokenData){
        let {useWalletAddress} = this.state;
        if(!useWalletAddress || !tokenData) return;
        const chainSymbol = useChainInfo.chainSymbol;
        tokenData.forEach((item)=>{
            BlockChainService.getBalance(useWalletAddress,item).then(data => {
                if(data === undefined || data === null) return;
                let key = chainSymbol+"_" + useWalletAddress + "_" +item.symbol;
                global[key] = data;
                this.setState({ [key]: data });
                if(item.symbol === 'USDT' || item.symbol === 'BNB'){
                    DeviceEventEmitter.emit("walletBalance", useChainInfo);
                }
            })
        })
    }
  //查询代币价格
  getTokenPrice(tokenInfo){
      let that = this;
    if(tokenInfo.symbol === 'FH' && tokenInfo.address){
        fetchFhTicker().then((data) => {
            if(data && data.price != null && !isNaN(data.price)){
                const price = parseFloat(data.price).toFixed(2);
                global[tokenInfo.symbol+"_Price"] = price;
                that.setState({
                    [tokenInfo.symbol+"_Price"]: price
                });
                return;
            }
            if(tokenInfo.router){
                BlockChainService.getTokenPrice(tokenInfo.address,tokenInfo.router).then(res => {
                    if(res == null || isNaN(parseFloat(res))) return;
                    const price = parseFloat(res).toFixed(2);
                    global[tokenInfo.symbol+"_Price"] = price;
                    that.setState({
                        [tokenInfo.symbol+"_Price"]: price
                    });
                })
            }
        });
        return;
    }
    if(tokenInfo.price){
        let url = "https://data-api.binance.vision/api/v3/ticker/price?symbol="+tokenInfo.price;

        fetch(url)
            .then((response) => response.json())
            .then((responseData) => {
                if(responseData){
                    let price = parseFloat(responseData.price).toFixed(2);
                    global[useChainInfo.chainSymbol+"_Price"] = price;
                    that.setState({
                        [tokenInfo.symbol+"_Price"]: price
                    });
                }
            })
            .catch((error) => {
            })
    }else if(tokenInfo.router){
        BlockChainService.getTokenPrice(tokenInfo.address,tokenInfo.router).then(data => {
            let price = parseFloat(data).toFixed(2);
            global[useChainInfo.chainSymbol+"_Price"] = price;
            that.setState({
                [tokenInfo.symbol+"_Price"]: price
            });
        })
    }
  }
  //删除添加的自定义代币
    deleteAddToken(tokenInfo){
        this.overlayDeleteTokenPullPull.close();

        let {addTokenList} = this.state;
        let newTokenList = [];
        for(let i=0;i<addTokenList.length;i++){
            if(addTokenList[i].address !== tokenInfo.address){
                let tokenList = {
                    address: addTokenList[i].address,
                    name: addTokenList[i].name,
                    symbol: addTokenList[i].symbol,
                    decimals: addTokenList[i].decimals
                }
                newTokenList.push(tokenList);
            }
        }
        this.setState({
            addTokenList:newTokenList
        })
        let key = useChainInfo.chainSymbol+'-AddTokenList';
        storage.save({
            key: key,
            data: newTokenList,
        });
        Toast.success(lan.t('all.success'))
    }
    getTotalMoney(){
        let {tokenList,useChainInfo,useWalletAddress} = this.state;
        let totalMoney = 0;
        for(let i=0;i<tokenList.length;i++){
            let tokenInfo = tokenList[i];
            if(useChainInfo && this.state[tokenInfo.symbol+"_Price"]){
                let money = (this.state[useChainInfo.chainSymbol+"_"+useWalletAddress+"_"+tokenInfo.symbol] * this.state[tokenInfo.symbol+"_Price"]).toFixed(4);
                totalMoney = totalMoney+parseFloat(money);
            }
        }
        if(totalMoney && totalMoney>0){
            return totalMoney.toFixed(5);
        }else{
            return "0.00"
        }
    }
  //复制地址
  copyAddress(){
    Toast.success(lan.t('all.copyAddress'));
    Clipboard.setString(walletAddress);
  }

  showNetPull() {
        let overlayView = (
            <Overlay.PullView
                ref={v => this.overlayNetPullView = v}
            >
                <View style={{width:WIDTH,backgroundColor: '#FFF'}}>
                    <View style={{}}>
                        <View style={{flexDirection:'row',justifyContent:'center',marginTop:p(30),alignItems:'center',marginBottom:p(30)}}>
                            <Text style={{color:'#333333',fontSize:p(30)}}>
                                {lan.t('wt.chainSwitch')}
                            </Text>
                        </View>
                        <View style={{height:p(20),width:WIDTH,backgroundColor:'#f5f3f3'}}/>
                        <View>
                            {
                                CHAIN_MAP.map((item,index)=>{
                                    return(
                                        <TouchableOpacity
                                            onPress={()=>this.setChainInfo(item,this.overlayNetPullView)}
                                            style={styles.linearGradient2} key={index}>
                                            <View style={{marginLeft:p(30)}}>
                                                <View style={{flexDirection: 'row',alignItems:'center'}}>
                                                    <Image style={{width:p(50),height:p(50),marginRight: p(15)}}
                                                           source={Images.token[item.chainSymbol]}/>
                                                    <Text style={{color:'#333333',fontSize:p(32)}}>
                                                        {item.chainName}({item.chainSymbol})
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
    nextTransferPage(item){
        this.props.navigation.push('TransferRecord',{item:item,useChainInfo:useChainInfo})
    }
  render() {
    let {useWalletAddress,tokenList,useChainInfo,UseWallet,addTokenList,tabs} = this.state;
    return (
        <View style={{flex:1,backgroundColor: '#FFF'}}>
            <StatusBar
                barStyle={'dark-content'}
                backgroundColor='transparent'
                translucent
            />
            <View style={{alignItems:'center',justifyContent:'center',marginTop: Platform.OS === 'ios'?p(90):p(80)}}>
                <View style={{justifyContent:'space-between',alignItems:'center',flexDirection:'row',width:WIDTH-p(50)}}>
                    <TouchableOpacity
                        onPress={()=>this.showNetPull()}
                        style={{flexDirection:'row',alignItems:'center'}}>
                        <AntDesign
                            name='menu-fold'
                            size={15}
                            color='#333333'
                            style={{marginTop: p(6)}}
                        />
                        <Text style={{color:'#060605',fontSize:p(28),marginLeft:p(10)}}>
                            {useChainInfo && useChainInfo.chainName}
                        </Text>
                        <View style={{width:p(12),height:p(12),marginTop:p(5),marginLeft:p(5),
                            backgroundColor:'#25ba8b',borderRadius:p(100)}}/>
                    </TouchableOpacity>

                    <View style={{flexDirection: 'row',alignItems:'center'}}>
                        <TouchableOpacity onPress={()=>this.props.navigation.push('ManageWallet')}>
                            <Image style={{width: p(65),height: p(65)}} source={require('../resource/image/nana/ico6.png')}/>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{marginLeft: p(20)}}
                            onPress={()=>this.props.navigation.push('ScanScreen',{useChainInfo: useChainInfo})}>
                            <Image style={{width: p(65),height: p(65)}} source={require('../resource/image/nana/ico5.png')}/>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{justifyContent:'space-between',alignItems:'center',marginTop:p(20)}}>
                    <ImageBackground
                        resizeMode="stretch"
                        source={require('../resource/image/spark/ico1.png')}
                        style={{width:WIDTH-p(50),height:p(200)}}>
                        <View style={{marginLeft:p(50),marginTop:p(30),width:WIDTH-p(80)}}>
                            <View>
                                <View style={{flexDirection:'row',alignItems:'center',flexWrap:'nowrap'}}>
                                    <Text numberOfLines={1} style={{color:'#5E5E5E',fontWeight:'500',fontSize:p(32),flexShrink:1}}>
                                        {useChainInfo.chainSymbol && UseWallet.name?UseWallet.name:useChainInfo.chainSymbol+'-HD'}
                                    </Text>
                                    <TouchableOpacity
                                        onPress={()=>this.copyAddress()}
                                        style={{justifyContent:'center',alignItems:'center'}}>
                                        <Image style={{width:p(45),height:p(45)}} source={require('../resource/image/copy.png')}/>
                                    </TouchableOpacity>
                                </View>
                                {/*<View style={{alignItems:'center',flexDirection:'row'}}>
                                    <Text style={{color:'#5E5E5E',fontWeight:'500',fontSize:p(26)}}>
                                        {useWalletAddress?useWalletAddress.substring(0,10):'***'}...
                                        {useWalletAddress?useWalletAddress.substring(useWalletAddress.length-10):''}
                                    </Text>
                                </View>*/}
                            </View>
                            <View style={{marginTop:p(30),flexDirection: 'row',alignItems: 'center'}}>
                                <Text style={{marginRight: p(20),color:'#0D1C3D'
                                    ,fontWeight:'500',fontSize:p(45)}}>
                                    ${this.getTotalMoney()}
                                </Text>
                                {/*<Entypo
                                  name='eye'
                                  size={p(35)}
                                  color={'#FFFFFF'}
                                />*/}
                            </View>
                        </View>
                    </ImageBackground>
                    <View style={{justifyContent:'space-between',flexDirection:'row',alignItems:'center',
                        width:WIDTH-p(30),marginBottom:p(10),marginTop:p(40)}}>

                        <TouchableOpacity
                            onPress={()=>this.props.navigation.push('Receive')}
                            style={{width:p(120),height:p(75),justifyContent:'center',alignItems:'center'}}>
                            <Image
                              style={{width: p(75),height: p(75)}}
                              source={require('../resource/image/nana/ico7.png')}
                            />
                            <Text style={{fontSize:p(26),color:'#060605',marginTop: p(10)}}>
                                {lan.t('news.shoukuan')}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={()=>this.props.navigation.push('Transfer',{
                                item: TOKEN_LIST[useChainInfo.chainSymbol][0],
                                useChainInfo: useChainInfo
                            })}
                            style={{width:p(120),height:p(75),justifyContent:'center',alignItems:'center'}}>
                            <Image
                              style={{width: p(75),height: p(75)}}
                              source={require('../resource/image/nana/ico8.png')}
                            />
                            <Text style={{fontSize:p(26),color:'#060605',marginTop: p(10)}}>
                                {lan.t('news.zhuanzhuang')}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={()=>{
                              if(isSwap){
                                  this.props.navigation.push('Swap');
                              }else{
                                  this.props.navigation.navigate('Bridgers');
                              }
                          }}
                          style={{width:p(120),height:p(75),justifyContent:'center',alignItems:'center'}}>
                            <Image
                              style={{width: p(75),height: p(75)}}
                              source={require('../resource/image/nana/ico9.png')}
                            />
                            <Text style={{fontSize:p(26),color:'#060605',marginTop: p(10)}}>
                                {lan.t('news.duihuan')}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={()=>this.props.navigation.push('ApprovalCheck',{
                              useChainInfo: useChainInfo,
                              walletAddress: useWalletAddress
                          })}
                          style={{width:p(150),height:p(75),justifyContent:'center',alignItems:'center'}}>
                            <Image
                              style={{width: p(75),height: p(75)}}
                              source={require('../resource/image/nana/ico10.png')}
                            />
                            <Text style={{fontSize:p(26),color:'#060605',marginTop: p(10)}}>
                                {lan.t('nana.liulanqi')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{backgroundColor: '#F5F6F8',height: p(120),width: WIDTH-p(50),marginTop: p(30),borderRadius:p(20)}}>
                    <View style={{
                        width: WIDTH - p(50),
                        height: p(130),
                        borderRadius: p(20),
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexDirection: 'row',
                        marginBottom:p(20)
                    }}>
                        <TouchableOpacity
                          onPress={()=>this.props.navigation.push('InviteFriend')}
                          style={{marginLeft: p(20), flexDirection: 'row', alignItems: 'center'}}>
                            <Image style={{width: p(80),height: p(80)}}
                                   source={require('../resource/image/spark/ico11.png')}/>
                            <View style={{marginLeft: p(10)}}>
                                <Text style={{
                                    color: '#0D1C3D',
                                    fontSize: p(26),
                                    fontWeight: '500',
                                }}>{lan.t('nana.yaoqqinghaoyou')}</Text>
                                <Text style={{
                                    color: '#808080',
                                    fontSize: p(20),
                                    marginTop: p(6)}}>
                                    {lan.t('nana.yaoqqinghaoyoutitle')}
                                </Text>
                            </View>
                        </TouchableOpacity>
                        <AntDesign
                          name='rightcircleo'
                          size={19}
                          color={'#b3b2b2'}
                          style={{marginRight: p(15)}}
                        />
                    </View>
                </View>

                <View style={{width:WIDTH-p(80),marginTop:p(30),marginBottom:p(20),
                    justifyContent:'space-between',flexDirection:'row',alignItems:'center'}}>
                    <View style={{flexDirection:'row',alignItems:'center'}}>
                        <TouchableOpacity style={{flexDirection: 'row'}} onPress={()=>this.setState({
                            tabs:1
                        })}>
                            <Image
                              style={{width: p(30),height: p(30),marginRight: p(10)}}
                              source={require('../resource/image/nana/ico12.png')}
                            />
                            <Text style={{color:tabs==1?'#3c3c3c':'#888787',fontSize:p(28),fontWeight:'500'}}>
                                {lan.t('news.zichan')}
                            </Text>
                        </TouchableOpacity>
                        {/*<TouchableOpacity onPress={()=>this.setState({
                            tabs:2
                        })}>
                            <Text style={{color:tabs==2?'#3c3c3c':'#888787',fontSize:p(28),fontWeight:'500',marginLeft:p(50)}}>
                                NFT
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={()=>this.setState({
                            tabs:3
                        })}>
                            <Text style={{color:tabs==3?'#3c3c3c':'#888787',fontSize:p(28),fontWeight:'500',marginLeft:p(50)}}>
                                DeFi
                            </Text>
                        </TouchableOpacity>*/}
                        <TouchableOpacity onPress={()=>this.setState({
                            tabs:4
                        })}>
                            <Text style={{color:tabs==4?'#3c3c3c':'#888787',fontSize:p(28),fontWeight:'500',marginLeft:p(50)}}>
                                Web3
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={()=>this.props.navigation.push('AddToken')}>
                        <AntDesign
                            name='pluscircleo'
                            size={20}
                            color={'#676666'}
                        />
                    </TouchableOpacity>
                </View>

                {
                    tabs==1?
                        <ScrollView>
                            <View style={{width:WIDTH-p(20),marginBottom:p(200)}}>
                                {
                                    tokenList && tokenList.map((item,index)=> {
                                        return (
                                            <TouchableOpacity
                                                onPress={()=>this.nextTransferPage(item)}
                                                key={index} style={{
                                                height: p(120),
                                                borderBottomColor: '#e8e8e8',
                                                borderBottomWidth: p(1),
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                flexDirection: 'row',
                                                marginBottom:p(10)
                                            }}>
                                                <View style={{marginLeft: p(20), flexDirection: 'row', alignItems: 'center'}}>
                                                    <Image resizeMode="stretch" style={styles.Image_01} source={Images.token[item.symbol]}/>
                                                   <View style={{marginLeft: p(20)}}>
                                                       <Text style={{
                                                           color: Theme.textColor,
                                                           fontSize: p(28),
                                                           fontWeight: '500',
                                                       }}>{item.symbol}</Text>
                                                       <Text style={{
                                                           color: '#616060',
                                                           fontSize: p(24),
                                                           marginTop: p(6)
                                                       }}>
                                                          ${this.state[item.symbol+"_Price"]?this.state[item.symbol+"_Price"]:'0.00'}
                                                       </Text>
                                                   </View>
                                                </View>
                                                <View style={{marginRight: p(20),alignItems:'flex-end'}}>
                                                    <Text style={{
                                                        color: Theme.textColor,
                                                        fontSize: p(32),
                                                        fontWeight: '500',
                                                    }}>
                                                        { (() => {
                                                            const bal = this.state[useChainInfo.chainSymbol+"_"+useWalletAddress+"_"+item.symbol];
                                                            return !bal || Number(bal) === 0 ? '0' : bal;
                                                        })() }
                                                    </Text>
                                                    <Text style={{color: '#706d6d', fontSize: p(26),marginTop:p(5)}}>
                                                        $
                                                        {
                                                            (() => {
                                                                const bal = this.state[useChainInfo.chainSymbol+"_"+useWalletAddress+"_"+item.symbol];
                                                                const price = this.state[item.symbol+"_Price"];
                                                                if (!bal || !price) return '0';
                                                                const v = bal * price;
                                                                return Number(v) === 0 ? '0' : v.toFixed(5);
                                                            })()
                                                        }
                                                    </Text>
                                                </View>
                                            </TouchableOpacity>
                                        )
                                    })
                                }

                                {
                                    addTokenList && addTokenList.map((item,index)=> {
                                        return (
                                            <TouchableOpacity
                                                onPress={()=>this.nextTransferPage(item)}
                                                onLongPress={()=>this.deleteTokenPull(item)}
                                                key={index} style={{
                                                height: p(120),
                                                borderBottomColor: '#e8e8e8',
                                                borderBottomWidth: p(1),
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                flexDirection: 'row',
                                                marginBottom:p(10)
                                            }}>
                                                <View style={{marginLeft: p(20), flexDirection: 'row', alignItems: 'center'}}>
                                                    {
                                                        Images.token[item.symbol]?
                                                            <Image resizeMode="stretch" style={item.symbol=='BSJ'?styles.Image_001:styles.Image_01} source={Images.token[item.symbol]}/>
                                                            :
                                                            <View style={{height:p(80),width:p(80),borderRadius:p(100),
                                                                backgroundColor: '#929191',justifyContent:'center',alignItems:'center'}}>
                                                                <Text style={{fontSize:p(20),color:'#ffffff'}}>
                                                                    {item.symbol}
                                                                </Text>
                                                            </View>
                                                    }

                                                    <View style={{marginLeft: p(20)}}>
                                                        <Text style={{
                                                            color: Theme.textColor,
                                                            fontSize: p(28),
                                                            fontWeight: '500'
                                                        }}>{item.symbol}</Text>
                                                    </View>
                                                </View>
                                                <View style={{marginRight: p(20),alignItems:'flex-end'}}>
                                                    <Text style={{
                                                        color: Theme.textColor,
                                                        fontSize: p(32),
                                                        fontWeight: '500',
                                                    }}>
                                                        { this.state[useChainInfo.chainSymbol+"_"+useWalletAddress+"_"+item.symbol]?
                                                            this.state[useChainInfo.chainSymbol+"_"+useWalletAddress+"_"+item.symbol]
                                                            :'0.0000'}
                                                    </Text>
                                                    <Text style={{color: '#706d6d', fontSize: p(26),marginTop:p(5)}}>
                                                        $
                                                        {
                                                            this.state[useChainInfo.chainSymbol+"_"+useWalletAddress+"_"+item.symbol] && this.state[item.symbol+"_Price"]?
                                                                (this.state[useChainInfo.chainSymbol+"_"+useWalletAddress+"_"+item.symbol] * this.state[item.symbol+"_Price"]).toFixed(4)
                                                                :'0.0000'
                                                        }
                                                    </Text>
                                                </View>
                                            </TouchableOpacity>
                                        )
                                    })
                                }
                            </View>
                        </ScrollView>
                        :tabs==2?
                        <Text style={{marginTop:p(300),color:'#888787'}}>
                            NFT
                        </Text>
                        :tabs==3?
                        <Text style={{marginTop:p(300),color:'#888787'}}>
                            Defi
                        </Text>
                        :tabs==4?
                        <Text style={{marginTop:p(300),color:'#888787'}}>
                            Web3
                        </Text>
                        :null
                }
            </View>
        </View>
    );
  }
    deleteTokenPull(tokenInfo){
        let overlayView = (
            <Overlay.PopView
                ref={v => this.overlayDeleteTokenPullPull = v}
                style={{alignItems: 'center', justifyContent: 'center'}}
            >
                <View style={{backgroundColor: '#fff', width: WIDTH-p(150), minHeight: p(200), borderRadius: p(10)}}>
                    <Text style={{fontSize: p(28),color:'#333333',marginLeft:p(30),marginTop:p(50)}}>
                        {lan.t('news.shifoushanchu')} {tokenInfo.symbol} {lan.t('news.daibi')} ？
                    </Text>
                    <View  style={{alignItems: 'center', justifyContent: 'center'}}>

                        <View style={{width:WIDTH-p(180),justifyContent:'flex-end',
                            alignItems: 'center',marginTop:p(50),flexDirection:'row'}}>
                            <TouchableOpacity onPress={()=>this.overlayDeleteTokenPullPull.close()}>
                                <Text style={{color:'#605f5f',fontWeight:'500',fontSize:p(28)}}>
                                    {lan.t('all.cancel')}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={{marginLeft:p(50),marginRight:p(20)}}
                                              onPress={()=>this.deleteAddToken(tokenInfo)} >
                                <Text style={{color:Theme.appColor,fontWeight:'500',fontSize:p(28)}}>
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
}

const styles = StyleSheet.create({
    linearGradient2: {
        justifyContent:'space-between',
        flexDirection: 'row',
        alignItems:'center',
        borderBottomColor:'#f5f3f3',
        borderBottomWidth:p(1),
        height:p(125),
    },
    touchableSty:{
        flexDirection:'row',
        justifyContent:'space-between',
        height:p(80),
        alignItems:'center'
    },
    lineStyle:{
        height:p(2),
        width:WIDTH/2+p(100),
        backgroundColor:'#224c86',
    },
    modalLayer: {
        justifyContent: 'center',
        height:HEIGHT-p(300),
    },
    modalTitleStyle: {
        fontSize: p(28),
        marginTop: p(20),
        marginLeft: p(10),
        color:'#7ea8d4'
    },
    viewSty4:{height:p(125),
        width:WIDTH-p(50),
        borderRadius:p(10),
        backgroundColor: 'rgba(23,23,56,0.59)',
        marginTop:p(30),
        justifyContent:'space-between',
        flexDirection:'row',
        alignItems:'center'
    },
    textSty3:{
        fontSize:p(26),
        color:'#414141',
        lineHeight:p(50)
    },
    viewSty:{
        backgroundColor:'#c3c3c3',
        justifyContent:'center',
        alignItems:'center',
        height:p(100),
        marginTop:p(50),
        marginBottom:p(50)
    },
    textSty2:{
        fontSize:p(70),
        fontWeight:'500',
        color:'#414141',
        marginLeft:p(50),
        marginRight:p(50)
    },
    textSty:{
        marginTop:p(45),
        fontSize:p(32),
        fontWeight:'500',
        color:'#414141'
    },
    linearGradient: {
        width: WIDTH/2-p(50),
        height: p(75),
        borderRadius: p(50),
        justifyContent:'center',
        alignItems:'center'
    },
    buttonText:{
        color:'#FFF',
        fontSize: p(30),
        lineHeight: p(60)
    },
    button:{
        width:WIDTH-p(80),
        height:p(70),
        justifyContent:'center',
        alignItems:'center'
    },
  swipView3:{
    justifyContent:'center',
    alignItems:'center',
    marginTop:p(80)
  },
  swipView2:{
    borderBottomWidth: p(1),
    borderBottomColor: '#fff100',
    marginTop:p(10)
  },
  swipView1:{
    width:WIDTH-p(100),
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'space-between'
  },
  swipText4:{
    fontSize:p(30),
    color:'#FFF',
    marginTop:p(10)
  },
  swipText3:{
    fontSize:p(30),
    color:'#fff100',
    fontWeight:'500'
  },
  swipText2:{
    color: '#fff100',
    fontSize: p(50),
    fontWeight:'500'
  },
  swipText:{
    color: '#FFF',
    fontSize: p(40),
    fontWeight:'500'
  },
    Image_001:{
    width:p(70),
    height:p(80)
  },Image_01:{
    width:p(70),
    height:p(70)
  },
  Text_07:{
    color:'#282828',
    fontSize: p(35)
  },
  Text_06:{
    color:'#414141',
    fontSize: p(28),
    marginTop:p(10)
  },
  Text_05:{
    color: '#282828',
    fontSize: p(35),
    marginLeft:p(10)
  },
  Text_04:{
    color: '#fff100',
    fontSize: p(28)
  },
  Text_03:{
    color: '#0e9b71',
    fontSize: p(50),
    fontWeight :'600'
  },
  Text_02:{
    color: '#0e9b71',
    fontSize: p(35),
  },
  Text_01:{
    color: '#FFF',
    fontSize: p(35),
    fontWeight :'500'
  },
  View_06:{
    flexDirection:'row',
    alignItems:'center'
  },
  View_05:{
    flexDirection: 'row',
    justifyContent:'space-between',
    alignItems:'center',
    width:WIDTH-p(50)
  },
  View_07:{
    height:p(130),
    backgroundColor:'#FFF',
    borderRadius:p(10),
    marginBottom:p(5),
    alignItems:'center',
    justifyContent:'center'
  },
  View_04:{
    height:p(150),
    backgroundColor:'#FFF',
    borderRadius:p(10),
    marginBottom:p(20),
    alignItems:'center',
    justifyContent:'center'
  },
  View_03:{
    marginTop:p(20),
  },
  View_02:{
    marginTop:p(10),
    alignItems:'center',
    flexDirection:'row',
    marginBottom:p(10)
  },
  View_01:{
    width:WIDTH-p(50),
    justifyContent: 'space-between',
    flexDirection:'row',
  },
  backgroundImage:{
    alignItems:'center',
    width:WIDTH,
    height:p(400),
    //不加这句，就是按照屏幕高度自适应
    //加上这几，就是按照屏幕自适应
    resizeMode:'stretch',
    //祛除内部元素的白色背景
    backgroundColor:'rgba(0,0,0,0)',
  }
});
