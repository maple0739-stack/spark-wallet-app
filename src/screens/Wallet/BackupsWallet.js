/**
 * Created by zenghao on 2018/11/16.
 */

import React, {Component} from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet, ImageBackground, TouchableOpacity, Clipboard,ScrollView
} from 'react-native' ;
import {Button} from "../../common/Button";
import * as BlockChain from '../../blockchain/BlockChainService.js';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {Head} from '../../common/Head';
export default class BackupsWallet extends Component {

  constructor(props) {
    super(props);
  }

  static navigationOptions = {
    header: null
    //headerTitle: lan.t('wallet.backupWallet')
  };

  // 状态
  state = {
    wordsList:[],
    walletList:[],
    walletPassword:'',
    walletName:'',
    privateKey:'',
    address:'',
    mnemonic:'',
    walletInfo:null,
    createState:false
  };


  componentDidMount() {
    //加载存在的钱包
    storage.load({
      key: 'WalletInfoList'
    }).then(data => {
      this.setState({
        walletList:data
      })
    })

    const { params } = this.props.navigation.state;
    this.setState({
      walletPassword:params.walletPassword,
      walletName:params.walletName
    })
    this.createWallet();
  }
  createWallet(){
    BlockChain.createWallet().then(data => {
      this.backupsWallet(data);
    }).catch(e => {
      Toast.info(lan.t('wallet.createFailed'))
    })
  }
  backupsWallet(data){
    this.setState({
      walletInfo:data,
      wordsList : data.mnemonic.split(" "),
      privateKey:data.privateKey,
      address:data.address,
      mnemonic:data.mnemonic,
      createState:true
    })
  }
  nextPage(){
    this.props.navigation.push('ConfirmWords',{
      walletInfo:this.state.walletInfo,
      walletName:this.state.walletName
    })
  }
  //复制地址
  copyAddress(text){
    Toast.success(lan.t('all.copyAddress'));
    Clipboard.setString(text);
  }
  // 渲染
  render() {
    let {wordsList,mnemonic} = this.state
    return (
        <View style={{flex:1,backgroundColor:Theme.backgroundColor}}>
          <Head
              leftOnPress={()=>this.props.navigation.goBack()}
              text={lan.t('wallet.remark1')}/>
          <View style={{justifyContent:'center',alignItems:'center',marginTop:p(50)}}>
            <View style={{backgroundColor:'#FFF',borderRadius: p(10)}}>
              <View style={{justifyContent:'center',alignItems:'center'}}>
                  <View style={{marginTop:p(30),alignItems:'center'}}>
                    <View style={{justifyContent:'space-between',alignItems:'center',
                      flexDirection:'row',width:WIDTH-p(60)}}>
                      <Text style={{fontSize:p(26),color:Theme.textColor}}>
                        {lan.t('wallet.walletMe')}
                      </Text>
                      <TouchableOpacity onPress={()=>this.copyAddress(mnemonic)}>
                        <AntDesign
                            name='save'
                            size={22}
                            color={Theme.appColor}
                        />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.View_05}>
                      <View style={styles.wordsBox}>
                        <View style={styles.wordsWrap}>
                          {
                            wordsList && wordsList.filter(item=>item!="").map((item,i)=>{
                              return(
                                  <View key={i} style={styles.wordItem}>
                                    <View style={styles.View_06}>
                                      <Text style={styles.Text_04} numberOfLines={1}>
                                        {item}
                                      </Text>
                                    </View>
                                  </View>
                              )
                            })
                          }
                        </View>
                      </View>
                    </View>
                      <Text style={{fontSize:p(24),color: Theme.remarkColor,
                        lineHeight:p(45),marginTop:p(20),fontWeight: '500'}}>
                        {lan.t('wal.anquanbeifen')}
                      </Text>
                  </View>
              </View>
            </View>
          </View>
          <Button text={lan.t('wal.beifenqianbao')}
            marginTop={p(50)}
            marginBottom={p(50)}
            width={p(100)}
            onPress={()=>this.nextPage()}
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
  },
  buttonText: {
    fontSize: p(30),
    color: '#ffffff',
    backgroundColor: 'transparent',
  },
  LineSty:{
    width:WIDTH-p(100),
    height:p(1),
    backgroundColor:'#E7E7E7',
    marginTop: p(10),
    marginBottom :p(30)
  },
  Text_04:{
    fontSize:p(24),
    color: '#FFFFFF',
  },
  View_05:{
    justifyContent:'center',
    minHeight:p(150),
    borderRadius:p(10),
    marginTop:p(20)
  },
  wordsBox:{
    backgroundColor:'#F5F6F8',
    width:WIDTH-p(60),
    marginBottom:p(40),
    justifyContent:'center',
    minHeight:p(180),
    borderRadius:p(10),
    paddingHorizontal:p(16),
    paddingVertical:p(20),
  },
  wordsWrap:{
    flexDirection:'row',
    flexWrap:'wrap',
  },
  wordItem:{
    width:'25%',
    paddingHorizontal:p(4),
    marginBottom:p(16),
  },
  View_06:{
    borderColor:'#e0e0e0',
    borderWidth:p(1),
    alignItems:'center',
    justifyContent:'center',
    borderRadius:p(10),
    height:p(55),
    backgroundColor: '#0D1C3D'
  },
  ViewSty1:{
    width:WIDTH,
    alignItems:'center',
    marginTop:p(150),
    height:p(700),
    justifyContent:'center'
  },
  ViewSty2:{
    width:WIDTH,
    marginTop:p(150),
    alignItems: 'center'
  },
})
