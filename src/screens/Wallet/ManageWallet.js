/**
 * Created by zh. on 2019/09/01.
 */

import React, {Component} from 'react';
import {
  Image, ImageBackground,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Platform, ScrollView, DeviceEventEmitter, Clipboard
} from 'react-native' ;
import AntDesign from 'react-native-vector-icons/AntDesign';
import {Overlay} from "teaset";
import {Images} from "../../resource";
import {Head} from "../../common/Head";
import {Input} from "react-native-elements";
export default class ManageWallet extends Component {
  constructor(props) {
    super(props);
  }
  static navigationOptions = {
    header: null
  };

  // 状态
  state = {
    walletInfoList:[],
    password:'',
    totalUsdt:0,
    totalBalance:0
  };


  componentDidMount(){
  //获取钱包列表
    storage.load({
      key: 'WalletInfoList'
    }).then(data => {
      this.setState({
        walletInfoList: data
      })
      this.queryBalance(data)
    }).catch(e=>{
    })
  }
  //复制地址
  copyAddress(toAdd){
    Toast.success(lan.t('all.copyAddress'));
    Clipboard.setString(toAdd);
  }
  //查询钱包余额
  queryBalance(walletData){
    let mainPrice = global[useChainInfo.chainSymbol+"_Price"];
    let totalUsdt = 0;
    let totalBalance = 0;
    walletData.map((item,index)=>{
      BlockChainService.getBalance(item.address,'').then(data => {
        if(data){
          this.setState({
            [item.address]: data
          });
          //计算资产
          totalUsdt = totalUsdt + (data * mainPrice);
          totalBalance = totalBalance + parseFloat(data)
          this.setState({
            totalUsdt:totalUsdt,
            totalBalance:totalBalance
          })
        }
      })
    })
  }
  //修改钱包名称
  updateWalletName(item){
    let {walletInfoList,walletName} = this.state;
    let walletNewList = [];
    for(let i=0;i<walletInfoList.length;i++){
      let WalletData;
      if(walletInfoList[i].address == item.address){
        WalletData = {
          mnemonic:walletInfoList[i].mnemonic,
          privateKey:walletInfoList[i].privateKey,
          address:walletInfoList[i].address,
          password:walletInfoList[i].password,
          name: walletName,
        }
        walletNewList.push(WalletData);
      }else{
        WalletData = {
          mnemonic:walletInfoList[i].mnemonic,
          privateKey:walletInfoList[i].privateKey,
          address:walletInfoList[i].address,
          password:walletInfoList[i].password,
          name:walletInfoList[i].name,
        }
        walletNewList.push(WalletData);
      }
      if(item.address == walletAddress){
        storage.save({
          key: 'UseWallet',
          data: WalletData
        });
      }
    }
    this.setState({
      walletInfoList:walletNewList
    })
    storage.save({
      key: 'WalletInfoList',
      data: walletNewList,
    });
  }
  //删除钱包
  deleteWalletInfo(item){
     let {walletInfoList} = this.state;
     let walletNewList = [];
     for(let i=0;i<walletInfoList.length;i++){
        if(walletInfoList[i].address !== item.address){
          let WalletData = {
            mnemonic:walletInfoList[i].mnemonic,
            privateKey:walletInfoList[i].privateKey,
            address:walletInfoList[i].address,
            password:walletInfoList[i].password,
            name:walletInfoList[i].name,
          }
          walletNewList.push(WalletData);
        }
     }
     this.setState({
       walletInfoList:walletNewList
     })
    storage.save({
      key: 'WalletInfoList',
      data: walletNewList,
    });
  }
  useWallet(walletData){
    //保存当前的钱包信息
    storage.save({
      key: 'UseWallet',
      data: walletData
    });
    this.props.navigation.replace('MainPage');
  }
  //验证钱包密码
  truePassword(item,type){
    let {password} = this.state;
    if(item.password!==password){
      Toast.info(lan.t('wallet.passwordError'));
      return
    }
    this.overlayPasswordPull.close()
    if(type==1){
      //删除钱包
      this.deleteWalletInfo(item)
    }else{
      //备份钱包
      this.props.navigation.push('BackupsWords',{walletInfo:item})
    }
  }
  walletPasswordPull(item,type){
    let overlayView = (
        <Overlay.PopView
            ref={v => this.overlayPasswordPull = v}
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
                    inputStyle={{fontSize:p(30),marginLeft:p(20)}}
                    inputContainerStyle={{borderColor:'#E7E7E7',borderWidth:p(1),borderRadius:p(10)}}
                    onChangeText={(password) => this.setState({password})}
                />
              </View>
              <Text style={{color: Theme.cancelColor,fontSize:p(24),marginTop:p(20)}}>
                {lan.t('pay.anquanmima')}
              </Text>

              <View style={{height:p(1),width:WIDTH-p(150),backgroundColor:'#E7E7E7',marginTop:p(60)}}/>

              <View style={{width:WIDTH/2,alignItems: 'center',flexDirection:'row',justifyContent:'space-between'}}>
                <TouchableOpacity
                    onPress={()=>this.overlayPasswordPull.close()}
                >
                  <Text style={{color: Theme.cancelColor,fontSize:p(30)}}>
                    {lan.t('all.cancel')}
                  </Text>
                </TouchableOpacity>
                <View style={{height:p(100),width: p(1),backgroundColor:'#E7E7E7'}}/>
                <TouchableOpacity
                    onPress={()=>this.truePassword(item,type)}>
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
  walletNamePull(item){
    let overlayView = (
        <Overlay.PopView
            ref={v => this.overlayWalletNamePull = v}
            style={{alignItems: 'center', justifyContent: 'center'}}
        >

          <View style={{backgroundColor: Theme.backgroundColor, width: WIDTH-p(150), borderRadius: p(10)}}>
            <View  style={{alignItems: 'center', justifyContent: 'center'}}>
              <View style={{alignItems:'center', justifyContent: 'center',height:p(120)}}>
                <Text style={{fontSize: p(30),color:'#585757',fontWeight:'500'}}>
                  {lan.t('pcd.xgqbmc')}
                </Text>
              </View>
              <View style={{width:WIDTH-p(180)}}>
                <Input
                    placeholder={lan.t('news.qingshurqianbaomingcheng')}
                    inputStyle={{fontSize:p(30),marginLeft:p(20)}}
                    inputContainerStyle={{borderColor:'#E7E7E7',borderWidth:p(1),borderRadius:p(10)}}
                    onChangeText={(walletName) => this.setState({walletName})}
                />
              </View>

              <View style={{height:p(1),width:WIDTH-p(150),backgroundColor:'#E7E7E7',marginTop:p(60)}}/>

              <View style={{width:WIDTH/2,alignItems: 'center',flexDirection:'row',justifyContent:'space-between'}}>
                <TouchableOpacity
                    onPress={()=>this.overlayWalletNamePull.close()}
                >
                  <Text style={{color: '#cf4545',fontSize:p(30)}}>
                    {lan.t('all.cancel')}
                  </Text>
                </TouchableOpacity>
                <View style={{height:p(100),width: p(1),backgroundColor:'#E7E7E7'}}/>
                <TouchableOpacity
                    onPress={()=>this.overlayWalletNamePull.close() && this.updateWalletName(item)}>
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
  showPull(item,walletName) {
    let name = item.name?item.name:walletName
    let overlayView = (
        <Overlay.PullView ref={v => this.overlayPullView = v}>
          <View style={{backgroundColor: '#FFF', width:WIDTH,borderTopRadius:p(100)}}>
            <View style={{flexDirection:'row',justifyContent:'center',marginTop:p(30),alignItems:'center'
              ,marginBottom:p(30)}}>
              <Text style={{fontSize: p(28),color:'#333333',fontWeight:'500'}}>
                {name}
              </Text>
            </View>
            <View style={{height:p(20),width:WIDTH,backgroundColor:'#f5f3f3'}}/>
            <TouchableOpacity
                onPress={()=>this.overlayPullView.close() && this.useWallet(item)}
                style={styles.TouchableSty}>
              <AntDesign
                  name='staro'
                  size={20}
                  color={'#333333'}
                  style={{marginLeft:p(30)}}
              />
              <Text style={styles.TextSty1}>
                {lan.t('pcd.syqb')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
                onPress={()=>this.overlayPullView.close() && this.walletPasswordPull(item,2)}
                style={styles.TouchableSty}>
              <AntDesign
                  name='exception1'
                  size={20}
                  color={'#333333'}
                  style={{marginLeft:p(30)}}
              />
              <Text style={styles.TextSty1}>
                {lan.t('pcd.bfqb')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
                onPress={()=>this.overlayPullView.close() && this.walletNamePull(item)}
                style={styles.TouchableSty}>
              <AntDesign
                  name='form'
                  size={20}
                  color={'#333333'}
                  style={{marginLeft:p(30)}}
              />
              <Text style={styles.TextSty1}>
                {lan.t('pcd.ggqbmm')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
                onPress={()=>this.overlayPullView.close() && this.walletPasswordPull(item,1)}
                style={styles.TouchableSty}>
              <AntDesign
                  name='warning'
                  size={20}
                  color={'#333333'}
                  style={{marginLeft:p(30)}}
              />
              <Text style={styles.TextSty1}>
                {lan.t('pcd.scqb')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
                onPress={()=>this.overlayPullView.close() && this.props.navigation.push('CreateWallet')}
                style={styles.TouchableSty}>
              <AntDesign
                  name='wallet'
                  size={20}
                  color={'#333333'}
                  style={{marginLeft:p(30)}}
              />
              <Text style={styles.TextSty1}>
                {lan.t('pcd.cjxqb')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
                onPress={()=>this.overlayPullView.close() && this.props.navigation.push('ImportWallet')}
                style={styles.TouchableSty}>
              <AntDesign
                  name='select1'
                  size={20}
                  color={'#333333'}
                  style={{marginLeft:p(30)}}
              />
              <Text style={styles.TextSty1}>
                {lan.t('pcd.drxqb')}
              </Text>
            </TouchableOpacity>
            <View style={{height:p(20),width:WIDTH,backgroundColor:'#f5f3f3'}}/>
            <TouchableOpacity
                onPress={() => this.overlayPullView && this.overlayPullView.close()}
                style={{justifyContent:'center',alignItems: 'center',height:p(85)}}>
              <Text style={{fontSize: p(26),color:'#333333'}}>
                {lan.t('all.cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </Overlay.PullView>
    );
    Overlay.show(overlayView);
  }
  // 渲染
  render() {
    let {walletInfoList,totalUsdt,totalBalance} = this.state
    return (
        <View style={{flex:1,backgroundColor: Theme.backgroundColor}}>
          <Head text={lan.t('my.manageWallet')} leftOnPress={()=>this.props.navigation.goBack()}/>

          <View style={{justifyContent:'center',alignItems:'center',marginTop:p(50)}}>
            <ImageBackground
                resizeMode="stretch"
                source={require('../../resource/image/nana/ico28.png')}
                style={{width:WIDTH-p(30),height:p(240),flexDirection:'row',
                  justifyContent:'space-between'}}>
              <View style={{marginTop:p(30),marginLeft:p(30)}}>
                <Text style={{fontSize:p(28),color:'#FFFFFF'}}>
                  {lan.t('pcd.zzczh')}({useChainInfo.chainSymbol})
                </Text>
                <Text style={{fontSize:p(40),color:'#FFFFFF',fontWeight: '500',marginTop:p(30)}}>
                  {parseFloat(totalBalance)>0 ? totalBalance.toFixed(4) : '00.00'}
                </Text>
                <Text style={{fontSize:p(26),color:'#FFFFFF',fontWeight: '500',marginTop: p(5)}}>
                  ${parseFloat(totalUsdt)>0 ? totalUsdt.toFixed(4) : '00.00'}
                </Text>
              </View>
              <View style={{marginTop:p(80),width:p(280),
                height:p(65),backgroundColor: '#FFD24C',flexDirection:'row',right:-p(50),
                borderRadius:p(50)}}>
                <View style={{flexDirection:'row',alignItems:'center',marginLeft:p(20)}}>
                  <AntDesign
                      name='Safety'
                      size={16}
                      color={'#000000'}
                      style={{marginRight:p(6)}}
                  />
                  <Text style={{fontSize:p(26),color:'#000000'}}>
                    {lan.t('pcd.zcbzz')}
                  </Text>
                </View>
              </View>
            </ImageBackground>
            <View style={{width:WIDTH-p(50)}}>
              <View style={{justifyContent:'space-between',alignItems:'center',flexDirection: 'row',marginTop:p(30)}}>
                <TouchableOpacity
                    onPress={()=>this.props.navigation.push('CreateWallet')}
                    style={{flexDirection: 'row',alignItems:'center'}}>
                  <Image
                    resizeMode="stretch"
                    style={{width: p(65),height: p(65)}}
                    source={require('../../resource/image/nana/ico29.png')}/>
                  <Text style={{fontSize:p(26),color:'#343232',marginLeft: p(10)}}>
                    {lan.t('pcd.cjxqb')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={()=>this.props.navigation.push('ImportWallet')}
                    style={{flexDirection: 'row',alignItems:'center',marginLeft: p(50)}}>
                  <Image
                    resizeMode="stretch"
                    style={{width: p(65),height: p(65)}}
                    source={require('../../resource/image/nana/ico30.png')}/>
                  <Text style={{fontSize:p(26),color:'#343232',marginLeft: p(10)}}>
                    {lan.t('pcd.drxqb')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={{height:p(15),width:WIDTH,backgroundColor:'#F6F7FD',marginTop:p(40)}}/>

          </View>
          <View style={{marginTop:p(20),justifyContent:'center',alignItems:'center'}}>
            <View style={{width:WIDTH-p(50)}}>
              <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
                <View style={{flexDirection:'row',alignItems:'center'}}>
                  <Text style={{fontSize:p(28),color:'#666666'}}>
                    {lan.t('pcd.qb')}
                  </Text>
                </View>
                  <Text style={{fontSize:p(26),color:'#666666',marginLeft:p(6)}}>
                    {lan.t('pcd.cysl')}({useChainInfo.chainSymbol})
                  </Text>
              </View>
            </View>
            <ScrollView style={{marginBottom: p(550)}}>
              {
                walletInfoList.map((item,index)=>{
                  let walletName = item.name?item.name:lan.t('pcd.qb')+(index+1)
                  let useAddress = useChainInfo.chainSymbol === 'TRX' ? item.tronAddress : item.address
                  return(
                      <View
                          key={index}
                          style={{width:WIDTH-p(60),height:p(200),flexDirection:'row',
                            borderColor: '#ebeff6',borderWidth: p(1),borderRadius: p(30),
                            justifyContent:'space-between',alignItems:'center',marginLeft:p(30),marginTop: p(20)}}>
                        <View style={{flexDirection:'row',alignItems:'center'}}>
                          <Image resizeMode="stretch" style={styles.Image_01} source={Images.token[useChainInfo.chainSymbol]}/>
                          <View>
                            <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',
                              width:WIDTH-p(120)}}>
                              <View style={{flexDirection:'row',alignItems:'center',flexWrap:'nowrap'}}>
                                <Text numberOfLines={1} style={{fontSize:p(28),marginRight:p(10),flexShrink:1,
                                  color:useAddress == walletAddress?'#e4b119':'#333333'}}>
                                  {walletName}
                                </Text>
                                {
                                  useAddress == walletAddress ?
                                      <AntDesign
                                          name='checkcircle'
                                          size={16}
                                          color={'#FFD24C'}
                                          style={{flexShrink:0}}
                                      />:null
                                }
                                <TouchableOpacity
                                    onPress={()=>this.copyAddress(item.address)}
                                    style={{marginLeft:p(10),justifyContent:'center',alignItems:'center',flexShrink:0}}>
                                  <Image style={{width:p(45),height:p(45)}} source={require('../../resource/image/copy.png')}/>
                                </TouchableOpacity>
                              </View>

                              <Text style={{fontSize:p(32),color:'#333333',marginRight: p(30)}}>
                                { global[useChainInfo.chainSymbol+"_"+useAddress+"_"+useChainInfo.chainSymbol]?
                                    global[useChainInfo.chainSymbol+"_"+useAddress+"_"+useChainInfo.chainSymbol]
                                    :'0.00'}
                              </Text>
                            </View>

                            <View style={{width:WIDTH-p(180),height:p(1),backgroundColor:'#F7F5F6',marginTop:p(10)}}/>

                            <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',
                              width:WIDTH-p(120),marginTop:p(20)}}>
                              <TouchableOpacity
                                  onPress={()=>this.useWallet(item)}
                                  style={{width:WIDTH/2}}>
                                <Text style={{fontSize:p(26),color:'#666666'}}>
                                  {useAddress}
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={()=>this.showPull(item,walletName)}
                                  style={{flexDirection:'row',alignItems:'center',marginRight: p(30)}}>

                                <AntDesign
                                  name='rightcircleo'
                                  size={20}
                                  color={'#c8c7c7'}
                                />

                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      </View>
                  )
                })
              }
              <View style={{height:p(150)}}/>
            </ScrollView>

          </View>
        </View>
    )
  }
}


const styles = StyleSheet.create({
  TextSty4:{color:'#FEFEFE',fontWeight:'500',fontSize:p(30)},
  TouchableSty2:{
    height: p(80),
    width:WIDTH/2,
    backgroundColor: '#138389',
    borderRadius:p(50),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: p(100),
    marginTop:p(20)
  },

  TextSty1:{fontSize:p(26),color:'#1d1d1d',marginLeft:p(10)},
  TouchableSty:{
    marginTop:p(20),height: p(75),alignItems:'center',
    borderBottomWidth:p(1),borderBottomColor:'#f5f3f3',flexDirection:'row'},
  Image_01:{
    width:p(70),
    height:p(70),
    left:-p(30)
  },

});

