/**
 * Created by zh. on 2019/09/01.
 */

import React, {Component} from 'react';
import {
  StyleSheet,
  View,
  Text,
  StatusBar, ImageBackground, TouchableOpacity,
} from 'react-native' ;
import {Input} from "react-native-elements";
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
import Entypo from 'react-native-vector-icons/Entypo';
import * as BlockChain from '../../blockchain/BlockChainService';
import {Head} from "../../common/Head";
import {Button} from "../../common/Button";
import commonStyles from "../../styles/commonStyles";
import {storeWalletSecrets} from '../../api/walletKeyStorage';
export default class ImportWallet extends Component {
  constructor(props) {
    super(props);
  }
  static navigationOptions = {
    header: null
    //headerTitle: lan.t('wallet.importWallet')
  };
  // 状态
  state = {
    tabs:1,
    walletList:[],
    refreshing:false,
    mnemonicWord:null,
    password1:null,
    password2:null,
    password3:null,
    password4:null,
    privateKey:null,
  };
  applyScanParams(params){
    if(params && params.key && params.tabs){
      if(params.tabs==1){
        this.setState({
          privateKey:params.key,
          tabs:params.tabs
        })
      }else{
        this.setState({
          mnemonicWord:params.key,
          tabs:params.tabs
        })
      }
    }
  }
  componentDidMount(){
    this.applyScanParams(this.props.navigation.state.params);
    this._navListener = this.props.navigation.addListener('didFocus', () => {
      this.applyScanParams(this.props.navigation.state.params);
    });
    storage.load({
      key: 'WalletInfoList'
    }).then(data => {
      this.setState({
        walletList:data
      })
    })
  }
  componentWillUnmount(){
    this._navListener && this._navListener.remove();
  }
  _onRefresh(){
    this.setState({
      refreshing: false
    })
  }
  ImportWallet(){
    if(!this.state.walletName){
      Toast.info(lan.t('wal.tianxieqianbaomingcheng'));
      return ;
    }
    if(!this.state.password || !this.state.password2){
      Toast.info(lan.t('wallet.enterPwd'));
      return ;
    }
    if(this.state.password != this.state.password2){
      Toast.info(lan.t('wallet.twoPassword'));
      return ;
    }
    if(this.state.password.length < 8){
      Toast.info(lan.t('wal.shezhiqianbaomima'));
      return ;
    }

    if(this.state.tabs==2){
      this.ImportMnemonicWordWords();
    }else{
      this.ImportPrivate();
    }
  }
  //私钥导入钱包
  ImportPrivate(){
    if(!this.state.privateKey){
      Toast.info(lan.t('wallet.enterPk'));
      return;
    }
    this.getPrivateLoading();
  }

  getPrivateLoading(){
    Loading.show(lan.t('wallet.walletImport'));
    var num = 1;
    this.timer = setInterval(() => {
      num--;
      if (num < 0) {
        this.timer && clearInterval(this.timer);
        this.getPrivateKey();
      }
    }, 1000);
  }

  getPrivateKey(){
    let walletPrivateKey = this.state.privateKey;
    let pk = walletPrivateKey.substring(0,2);
    let private_key = walletPrivateKey;
    if(pk !== "0x"){
      private_key = "0x"+walletPrivateKey;
    }

    let pattern = /^(0x)?[0-9a-fA-F]{64}$/;
    if(!pattern.test(private_key)){
      Toast.info(lan.t('wallet.pkFailure'));
      Loading.hide();
      return false;
    }
    BlockChain.ImportPrivateKey(private_key).then(data => {
      Loading.hide();
      if(data){
        let tronAddress = TronWeb.address.fromHex(data.address);
        let ETHWallet = {
          mnemonic:'',
          privateKey:data.privateKey,
          address:data.address,
          tronAddress:tronAddress,
          password:this.state.password,
          name: this.state.walletName
        }
        this.getMainPage(ETHWallet)
      }
    })
  }
  //助记词导入钱包
  ImportMnemonicWordWords(){
    if(!this.state.mnemonicWord){
      Toast.info(lan.t('wallet.enterMe'));
      return;
    }
      this.getWordsLoading();
  }
  getWordsLoading(){
    Loading.show(lan.t('wallet.walletImport'));
    var num = 1;
    this.timer = setInterval(() => {
      num--;
      if (num < 0) {
        this.timer && clearInterval(this.timer);
        this.getWords();
      }
    }, 1000);
  }
  getWords(){
    BlockChain.ImportMemorizingWords(this.state.mnemonicWord).then(data => {
      Loading.hide();
      if(data){
        let tronAddress = TronWeb.address.fromHex(data.address);
        let ETHWallet = {
          mnemonic:data.mnemonic,
          privateKey:data.privateKey,
          address:data.address,
          tronAddress:tronAddress,
          password:this.state.password,
          name: this.state.walletName
        }
        this.getMainPage(ETHWallet)
      }
    })
  }
  getMainPage(ETHWallet){
    //是否存在在钱包信息
    this.state.walletList.push(ETHWallet);

    //保存当前选择的钱包信息
    storage.save({
      key: 'UseWallet',
      data: ETHWallet
    });
    //保存钱包集合
    storage.save({
      key: 'WalletInfoList',
      data: this.state.walletList,
    });
    storeWalletSecrets(ETHWallet);
    Toast.success(lan.t('wallet.importSuccess'));
    this.props.navigation.replace('MainPage');
  }
  scanWallet(){
    this.props.navigation.push('ScanScreen',{importKey: true})
  }
  // 渲染
  render() {
    const {tabs} = this.state;
    return (
        <View style={{flex:1,backgroundColor:Theme.backgroundColor}}>
          <StatusBar
            barStyle={'dark-content'}
            backgroundColor='transparent'
            translucent
          />

          <Head text={lan.t('wallet.importWallet')} rightTab={'importWallet'}
                rightOnPress={()=>this.scanWallet()}
                leftOnPress={()=>this.props.navigation.goBack()}/>

          <View style={{flexDirection: 'row',marginTop: p(50),marginLeft:p(30)}}>
           <TouchableOpacity
               style={{flexDirection: 'row',alignItems:'center'}}
               onPress={()=>this.setState({
             tabs: 1
           })}>
             <Entypo
                 name='key'
                 size={18}
                 color={tabs==1 ? Theme.appColor : '#969696'}
             />
             <Text style={{fontSize:p(28),color: tabs==1?Theme.appColor:'#969696',fontWeight:'500',marginLeft:p(10)}}>
               {lan.t('wallet.pImport')}
             </Text>
           </TouchableOpacity>

            <TouchableOpacity
                style={{flexDirection: 'row',alignItems:'center',marginLeft:p(150)}}
                onPress={()=>this.setState({
              tabs: 2
            })}>
              <AntDesign
                  name='hdd'
                  size={18}
                  color={tabs==2 ? Theme.appColor : '#969696'}
              />
             <Text style={{fontSize:p(28),color: tabs==2?Theme.appColor:'#969696',fontWeight:'500'}}>
               {lan.t('wallet.mImport')}
             </Text>
           </TouchableOpacity>

          </View>

          <View style={{width:WIDTH,height:p(2),backgroundColor:'#F6F7FD',marginTop:p(20)}}/>

          <View style={{justifyContent:'center',alignItems:'center'}}>
              <View style={{backgroundColor:'#FFF',borderRadius: p(10),justifyContent:'center',alignItems:'center'}}>
                <View style={{width:WIDTH-p(20)}}>
                  {
                    tabs === 1?
                        <View>
                          <Text style={commonStyles.inputTitle}>
                            {lan.t('wallet.walletPk')}：
                          </Text>
                          <Input
                            multiline
                            value={this.state.privateKey || ''}
                            placeholder={lan.t('wallet.enterPk')}
                            inputStyle={{color: Theme.textColor,fontSize:p(28)}}
                            inputContainerStyle={commonStyles.inputMultilineContainer}
                            onChangeText={(privateKey) => this.setState({privateKey})}
                          />
                        </View>
                        :
                        <View>
                          <Text style={commonStyles.inputTitle}>
                            {lan.t('wallet.walletMe')}：
                          </Text>
                          <Input
                            multiline
                            value={this.state.mnemonicWord || ''}
                            placeholder={lan.t('wallet.enterMe')}
                            inputStyle={{color: Theme.textColor,fontSize:p(28)}}
                            inputContainerStyle={commonStyles.inputMultilineContainer}
                            onChangeText={(mnemonicWord) => this.setState({mnemonicWord})}
                          />
                        </View>
                  }

                  <Text style={commonStyles.inputTitle}>
                    {lan.t('wal.qianbaomingcheng')}：
                  </Text>
                  <Input
                    placeholder= {lan.t('wal.tianxieqianbaomingcheng')}
                    inputStyle={{color: Theme.textColor,fontSize:p(28)}}
                    inputContainerStyle={commonStyles.inputContainer}
                    onChangeText={(walletName) => this.setState({walletName})}
                  />

                  <Text style={commonStyles.inputTitle}>
                    {lan.t('wal.qianbaomima')}：
                  </Text>
                  <Input
                    secureTextEntry={true}
                    placeholder= {lan.t('wal.shezhiqianbaomima')}
                    inputStyle={commonStyles.inputContent}
                    inputContainerStyle={commonStyles.inputContainer}
                    onChangeText={(password) => this.setState({password})}
                  />

                  <Text style={commonStyles.inputTitle}>
                    {lan.t('wal.querenmima')}：
                  </Text>
                  <Input
                    secureTextEntry={true}
                    placeholder= {lan.t('wal.querenmima')}
                    inputStyle={commonStyles.inputContent}
                    inputContainerStyle={commonStyles.inputContainer}
                    onChangeText={(password2) => this.setState({password2})}
                  />
                </View>
              </View>
          </View>

          <Button
              marginTop={p(50)}
              marginBottom={p(50)}
              width={p(100)}
              text={lan.t('wallet.trueImport')}
              onPress={()=>this.ImportWallet()}
          />
        </View>

    )
  }

}


const styles = StyleSheet.create({
  linearGradient: {
    width: WIDTH-p(280),
    height: p(90),
    borderRadius: p(50),
    justifyContent:'center',
    alignItems:'center',
    marginBottom: p(100)
  },
  buttonText: {
    fontSize: p(30),
    color: '#ffffff',
    backgroundColor: 'transparent',
  },
  ViewSty1:{
    justifyContent:'space-between',
    alignItems:'center',
    flexDirection:'row',
    marginTop:p(10)
  },
});
