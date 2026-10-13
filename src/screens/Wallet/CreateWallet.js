/**
 * Created by zenghao on 2018/11/15.
 */

import React, {Component} from 'react';
import {
  View,
  Text, StyleSheet, KeyboardAvoidingView, ScrollView, ImageBackground, TouchableOpacity, StatusBar,
} from 'react-native' ;

import { Input } from 'react-native-elements';
import { Head } from '../../common/Head';
import { Button } from '../../common/Button';
import AntDesign from "react-native-vector-icons/AntDesign";
import commonStyles from '../../styles/commonStyles';
export default class CreateWallet extends Component {
  constructor(props) {
    super(props);
  }
  static navigationOptions = {
    header: null
    //headerTitle: lan.t('wallet.createWallet')
  };


  // 状态
  state = {

  };


  componentDidMount(){
  }

  nextPage(){
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

    Loading.show(lan.t('wal.zhengzaichuangjian'));
    let num = 1;
    this.timer = setInterval(() => {
      num--;
      if (num < 0) {
        this.timer && clearInterval(this.timer);
        this.getBackupsWallet();
      }
    }, 500);
  }
  getBackupsWallet(){
    Loading.hide();
    storage.save({
      key: 'walletPassword',
      data:{
        walletPassword: this.state.password
      }
    });
    this.props.navigation.push('BackupsWallet',{
      walletPassword:this.state.password,
      walletName:this.state.walletName
    });
  }

  // 渲染
  render() {
    return (
        <View style={{flex:1,backgroundColor:Theme.backgroundColor}}>
          <StatusBar
            barStyle={'dark-content'}
            backgroundColor='transparent'
            translucent
          />
          <Head
              leftOnPress={()=>this.props.navigation.goBack()}
              text={lan.t('pcd.cjxqb')}/>
          <View style={{justifyContent:'center',alignItems:'center'}}>
            <View style={{width:WIDTH-p(20)}}>
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

              <View style={{flexDirection: 'row',alignItems:'center',marginTop:p(50),marginLeft: p(20)}}>
                <AntDesign
                  name='checkcircle'
                  size={18}
                  color= {'#131313'}
                />
                <Text style={{fontSize: p(26),color:'#333333',marginLeft: p(6)}}>
                  {lan.t('wal.yuedu')}<Text style={{color:Theme.appColor}}> Spark
                  {lan.t('wal.xieyi')}</Text>
                </Text>
              </View>

            </View>
            <Button
                marginTop={p(50)}
                marginBottom={p(50)}
                text={lan.t('wal.querenchuangjian')}
                onPress={()=>this.nextPage()}
            />
          </View>
          <View style={{width:WIDTH-p(80),marginLeft:p(40),marginTop:p(20)}}>
            <Text style={{fontSize:p(24),color:Theme.remarkColor,lineHeight:p(45),fontWeight: '500'}}>
              {lan.t('wal.remark1')}
            </Text>
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
    marginTop: p(100),
    marginBottom: p(150)
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
  ViewSty1:{
    justifyContent:'space-between',
    alignItems:'center',
    flexDirection:'row',
  },
})
