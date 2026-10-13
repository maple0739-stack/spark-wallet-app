/**
 * Created by zh. on 2019/09/01.
 */

import React, {Component} from 'react';
import {
  Image,
  ImageBackground,
  Switch,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native' ;
import AntDesign from 'react-native-vector-icons/AntDesign';
import Entypo from 'react-native-vector-icons/Entypo';
import I18n from "react-native-i18n";
import {Overlay} from "teaset";
import {Head} from "../../common/Head";
import {Input} from 'react-native-elements';
export default class Password extends Component {
  constructor(props) {
    super(props);
    this.state = {
      modalVisible:false,
      wallet:false,
      choice:false,
      SwitchValue:true
    };
  }
  static navigationOptions = {
    header: null
  };

  componentDidMount(){
    storage.load({
      key: 'PasswordSwitch'
    }).then(data => {
       this.setState({
         SwitchValue:data
       })
    }).catch(e=>{

    })
  }
  updateSwitch (value) {
    if(this.state.password !== walletPassword){
      Toast.info(lan.t('wallet.passwordError'));
      return ;
    }
    this.overlayPassword.close();
     this.setState({
       SwitchValue:value
     })
    storage.save({
      key: 'PasswordSwitch',
      data: value,
    });
     if(value){
       Toast.success('已开启钱包支付密码');
     }else{
       Toast.success('钱包支付密码已关闭');
     }
  }
  // 渲染
  render() {
    let {SwitchValue} = this.state;
    return (
        <View style={{flex:1,backgroundColor:'#f8f8f8'}}>
          <Head text={lan.t('pay.zhifumima')} leftOnPress={()=>this.props.navigation.goBack()}/>

          <View style={{justifyContent:'center',alignItems:'center',marginTop:p(40)}}>
            <ImageBackground
                resizeMode="stretch"
                source={require('../../resource/image/wallet/ico20.jpg')}
                style={{width:WIDTH-p(30),height:p(150),
                  justifyContent:'center',alignItems:'center'}}>
                <TouchableOpacity
                    style={styles.linearGradient}
                    onPress={()=>this.props.navigation.push('UpdatePayPassword')}>
                  <View style={{flexDirection: 'row',alignItems:'center'}}>
                    <AntDesign
                        name='key'
                        size={20}
                        color= {Theme.appColor}
                    />
                    <Text style={styles.text_01}>
                      {lan.t('pay.updateTitle')}
                    </Text>
                  </View>
                  <AntDesign
                      name='rightcircle'
                      size={26}
                      color= {Theme.appColor}
                      style={{marginRight:p(20)}}
                  />
                </TouchableOpacity>
            </ImageBackground>

            <ImageBackground
                resizeMode="stretch"
                source={require('../../resource/image/wallet/ico20.jpg')}
                style={{width:WIDTH-p(30),height:p(150),
                  justifyContent:'center',alignItems:'center'}}>
              <TouchableOpacity
                  style={styles.linearGradient}>
                <View style={{flexDirection: 'row',alignItems:'center'}}>
                  <AntDesign
                      name='unlock'
                      size={26}
                      color= {Theme.appColor}
                  />
                  <Text style={styles.text_01}>
                    {lan.t('pay.zhifumima')}
                  </Text>
                </View>
                <Switch
                    value= {SwitchValue}
                    trackColor={{false: Theme.textColor,true: Theme.appColor}}
                    thumbColor={SwitchValue ? '#e6b41f' : '#f4f3f4'}
                    onValueChange={(value)=>this.walletPasswordPull(value)}
                />
              </TouchableOpacity>
            </ImageBackground>
          </View>
        </View>
    )
  }
  walletPasswordPull(value){
    let overlayView = (
        <Overlay.PopView
            ref={v => this.overlayPassword = v}
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
                    placeholder={lan.t('pay.qingshurqianbaomima')}
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
              <Text style={{color: Theme.cancelColor,fontSize:p(24),marginTop:p(20)}}>
                {lan.t('pay.anquanmima')}
              </Text>

              <View style={{height:p(1),width:WIDTH-p(150),backgroundColor:'#E7E7E7',marginTop:p(60)}}/>

              <View style={{width:WIDTH/2,alignItems: 'center',flexDirection:'row',justifyContent:'space-between'}}>
                <TouchableOpacity
                    onPress={()=>this.overlayPassword.close()}
                >
                  <Text style={{color: Theme.cancelColor,fontSize:p(30)}}>
                    {lan.t('all.cancel')}
                  </Text>
                </TouchableOpacity>
                <View style={{height:p(100),width: p(1),backgroundColor:'#E7E7E7'}}/>
                <TouchableOpacity
                    onPress={()=>this.updateSwitch(value)}
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
}


const styles = StyleSheet.create({
  text_01:{
    color:'#262626',
    fontSize:p(28),
    margin:p(10)
  },
  image_01:{
    width:p(55),
    height:p(55)
  },

  viewSty5:{
    width:WIDTH-p(100),
    flexDirection: 'row',
    alignItems:'center',
    justifyContent:'space-between'
  },
  viewSty4:{
    height:p(120),
    width:WIDTH-p(50),
    borderRadius:p(10),
    backgroundColor: 'rgba(23,23,56,0.59)',
    marginTop:p(50),
    justifyContent:'space-between',
    flexDirection:'row',
    alignItems:'center'
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
    paddingTop: p(120)
  },
  modalContainer: {
    backgroundColor: '#2F334E',
    height:HEIGHT,
    width:WIDTH/2+p(100)
  },
  modalTitleStyle: {
    fontSize: p(28),
    marginTop: p(20),
    marginLeft: p(10),
    color:'#7ea8d4'
  },
  linearGradient2: {
    justifyContent:'space-between',
    flexDirection: 'row',
    alignItems:'center',
    borderBottomColor:'#f5f3f3',
    borderBottomWidth:p(1),
    height:p(125)
  },
  linearGradient: {
    justifyContent:'space-between',
    flexDirection: 'row',
    alignItems:'center',
    width:WIDTH-p(100)
  },
  buttonText: {
    fontSize: p(30),
    color: '#ffffff',
    backgroundColor: 'transparent',
  },
  buttonSty:{
    width: p(570),
    height: p(100),
    //background: linear-gradient(90deg, #2B64B2, #080F1C),
    borderRadius: p(50)
  },
  button:{
    width:WIDTH-p(100),
    height:p(80),
    justifyContent:'center',
    alignItems:'center',
    //祛除内部元素的白色背景
    backgroundColor:'rgba(0,0,0,0)',
    marginTop:p(20)
  },
  Text_04:{
    color:'#FFF',
    fontSize: p(30),
    lineHeight: p(60)
  },
  buttomStyle:{
    width:p(600),
    height:p(90),
    backgroundColor:themeColor
    ,alignItems:'center',
    justifyContent:'center',
    borderRadius:p(40)
  },
  backgroundImage:{
    alignItems:'center',
    width:null,
    height:p(360),
    //不加这句，就是按照屏幕高度自适应
    //加上这几，就是按照屏幕自适应
    //resizeMode:Image.resizeMode.contain,
    //祛除内部元素的白色背景
    backgroundColor:'rgba(0,0,0,0)',
  },
});

