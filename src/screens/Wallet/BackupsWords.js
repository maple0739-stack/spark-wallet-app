/**
 * Created by zenghao on 2018/11/16.
 */

import React, {Component} from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet, ImageBackground, TouchableOpacity, Clipboard,
} from 'react-native' ;
import { Head } from '../../common/Head';
import AntDesign from 'react-native-vector-icons/AntDesign';
import QRCode from 'react-native-qrcode-svg';
export default class BackupsWords extends Component {

  constructor(props) {
    super(props);
  }

  static navigationOptions = {
    header: null
  };

  // 状态
  state = {
    walletInfo:[],
    wordsList:[],
    mnemonicStr:'',
    showMnemonicQr:false,
    showPrivateKeyQr:false,
  };
  componentDidMount() {
    const { params } = this.props.navigation.state;
    let wordsList;
    let mnemonicStr = '';
    if(params.walletInfo.mnemonic){
        if(params.walletInfo.mnemonic.phrase){
          mnemonicStr = params.walletInfo.mnemonic.phrase
          wordsList = mnemonicStr.split(" ")
        }else{
          mnemonicStr = params.walletInfo.mnemonic
          wordsList = mnemonicStr.split(" ")
        }
    }
    this.setState({
      walletInfo: params.walletInfo,
      wordsList: wordsList,
      mnemonicStr: mnemonicStr,
    })

  }
  getHome(){
    this.props.navigation.replace('MainPage');
  }
  //复制地址
  copyAddress(text){
    Toast.success(lan.t('all.copyAddress'));
    Clipboard.setString(text);
  }
  // 渲染
  render() {
    let {walletInfo,wordsList,mnemonicStr,showMnemonicQr,showPrivateKeyQr} = this.state
    return (
        <View style={{flex:1,backgroundColor:Theme.backgroundColor}}>

          <Head
              leftOnPress={()=>this.props.navigation.goBack()}
              text= {lan.t('wallet.remark1')}/>

          <View style={{justifyContent:'center',alignItems:'center',marginTop:p(50)}}>
            <View style={{width:WIDTH-p(50),backgroundColor:'#FFF',borderRadius: p(10)}}>
              <View style={{justifyContent:'center',alignItems:'center',width:WIDTH-p(50)}}>
                  <View style={{justifyContent:'space-between',alignItems:'center',flexDirection:'row',width:WIDTH-p(80)}}>
                    <Text style={{fontSize:p(26),color:'#414141'}}>
                      {walletInfo.name || ''}
                    </Text>
                  </View>
                  <View style={{width:WIDTH-p(100),marginTop:p(20)}}>
                    <Text style={{fontSize:p(24),color:'#5e5e5e'}}>
                      {walletInfo.address}
                    </Text>
                  </View>
                  <View style={styles.LineSty}/>

                  <View style={{justifyContent:'space-between',alignItems:'center',flexDirection:'row',width:WIDTH-p(80)}}>
                    <Text style={{fontSize:p(26),color:'#414141'}}>
                      {lan.t('wallet.walletMe')}
                    </Text>
                    <View style={{flexDirection:'row',alignItems:'center'}}>
                      <TouchableOpacity onPress={()=>this.copyAddress(mnemonicStr)} style={{marginRight:p(20)}}>
                        <AntDesign
                            name='save'
                            size={22}
                            color={'#999'}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={()=>this.setState({showMnemonicQr:!showMnemonicQr})}>
                        <AntDesign
                            name='qrcode'
                            size={22}
                            color={showMnemonicQr?Theme.appColor:'#999'}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                  {showMnemonicQr ? (
                    <View style={{marginTop:p(20),marginBottom:p(10),alignItems:'center'}}>
                      <QRCode
                          value={mnemonicStr || ' '}
                          backgroundColor={"#ffffff"}
                          size={p(300)}
                      />
                    </View>
                  ) : (
                  <View style={styles.View_05}>
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
                  )}
                  <View style={styles.LineSty}/>

                  <View style={{justifyContent:'space-between',alignItems:'center',flexDirection:'row',width:WIDTH-p(80)}}>
                    <Text style={{fontSize:p(26),color:'#414141'}}>
                      {lan.t('wallet.walletPk')}
                    </Text>
                    <View style={{flexDirection:'row',alignItems:'center'}}>
                      <TouchableOpacity onPress={()=>this.copyAddress(walletInfo.privateKey)} style={{marginRight:p(20)}}>
                        <AntDesign
                            name='save'
                            size={22}
                            color={'#999'}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={()=>this.setState({showPrivateKeyQr:!showPrivateKeyQr})}>
                        <AntDesign
                            name='qrcode'
                            size={22}
                            color={showPrivateKeyQr?Theme.appColor:'#999'}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                  {showPrivateKeyQr ? (
                    <View style={{marginTop:p(20),alignItems:'center'}}>
                      <QRCode
                          value={walletInfo.privateKey || ' '}
                          backgroundColor={"#ffffff"}
                          size={p(300)}
                      />
                    </View>
                  ) : (
                  <View style={{width:WIDTH-p(100),marginTop:p(20)}}>
                    <Text style={{fontSize:p(28),color:'#333333'}}>
                      {walletInfo.privateKey}
                    </Text>
                  </View>
                  )}

                  <View style={styles.LineSty}/>

                  <View style={{justifyContent:'center',alignItems:'center',
                    width:WIDTH-p(100),marginBottom:p(100)}}>
                    <Text style={{fontSize:p(24),color:'#7d7f80',lineHeight:p(45)}}>
                      {lan.t('wal.remark1')}
                    </Text>
                  </View>
              </View>
            </View>
          </View>


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
    top:-p(220),
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
    marginTop:p(20),
    width:WIDTH-p(100),
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
    top:-p(220),
    height:p(700),
    justifyContent:'center'
  },
  ViewSty2:{
    width:WIDTH,
    alignItems: 'center'
  },
})
