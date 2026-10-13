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
export default class Settings extends Component {
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
  setLanguage(local){
    this.overlayPullLanguage.close()
    I18n.locale = local;
    storage.save({
      key: 'language',
      data: local,
    });
    this.props.navigation.replace('MainPage');
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
          <Head text={lan.t('my.settings')} leftOnPress={()=>this.props.navigation.goBack()}/>

          <View style={{justifyContent:'center',alignItems:'center',marginTop:p(40)}}>
            <ImageBackground
                resizeMode="stretch"
                source={require('../../resource/image/wallet/ico20.jpg')}
                style={{width:WIDTH-p(30),height:p(150),
                  justifyContent:'center',alignItems:'center'}}>
                <TouchableOpacity
                    onPress={()=>this.pullLanguage()}
                    style={styles.linearGradient}>
                  <View style={{flexDirection: 'row',alignItems:'center'}}>
                    <AntDesign
                        name='earth'
                        size={20}
                        color= {Theme.appColor}
                    />
                    <Text style={styles.text_01}>
                      {lan.t('language.set')}
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
          </View>
        </View>
    )
  }
  pullLanguage(){
    let overlayView = (
        <Overlay.PullView
            ref={v => this.overlayPullLanguage = v}
        >
          <View style={{width:WIDTH,backgroundColor: '#FFF'}}>
            <View>
              <View style={{justifyContent:'center',height:p(100),alignItems:'center',flexDirection:'row'}}>
                <Text style={{color: Theme.textColor,fontSize:p(30)}}>
                  {lan.t('language.set')}
                </Text>
              </View>
              <View style={{height:p(20),width:WIDTH,backgroundColor:'#f5f3f3'}}/>
              <View>
                <TouchableOpacity
                    onPress={()=> this.setLanguage('en')}
                    style={styles.linearGradient2}>
                  <View style={{flexDirection: 'row',alignItems:'center',marginLeft: p(30)}}>
                    <Image style={styles.image_01}
                           source={require('../../resource/image/national/yingguo.png')}/>
                    <Text style={styles.text_01}>
                      {lan.t('language.en')}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={()=> this.setLanguage('zh')}
                    style={styles.linearGradient2}>
                  <View style={{flexDirection: 'row',alignItems:'center',marginLeft: p(30)}}>
                    <Image style={styles.image_01}
                           source={require('../../resource/image/national/zhongguo.png')}/>
                    <Text style={styles.text_01}>
                      {lan.t('language.ch')}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={()=> this.setLanguage('tw')}
                    style={styles.linearGradient2}>
                  <View style={{flexDirection: 'row',alignItems:'center',marginLeft: p(30)}}>
                    <Image style={styles.image_01}
                           source={require('../../resource/image/national/zhongguo.png')}/>
                    <Text style={styles.text_01}>
                      {lan.t('language.tw')}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={()=> this.setLanguage('kor')}
                    style={styles.linearGradient2}>
                  <View style={{flexDirection: 'row',alignItems:'center',marginLeft: p(30)}}>
                    <Image style={styles.image_01}
                           source={require('../../resource/image/national/hanguo.png')}/>
                    <Text style={styles.text_01}>
                      {lan.t('language.kor')}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={()=> this.setLanguage('jap')}
                    style={styles.linearGradient2}>
                  <View style={{flexDirection: 'row',alignItems:'center',marginLeft: p(30)}}>
                    <Image style={styles.image_01}
                           source={require('../../resource/image/national/riben.png')}/>
                    <Text style={styles.text_01}>
                      {lan.t('language.jap')}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
              <View style={{height:p(20),width:WIDTH,backgroundColor:'#f5f3f3'}}/>
              <TouchableOpacity
                  onPress={() => this.overlayPullLanguage && this.overlayPullLanguage.close()}
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

