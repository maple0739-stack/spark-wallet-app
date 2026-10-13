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
  Platform
} from 'react-native' ;
import LinearGradient from 'react-native-linear-gradient';
import AntDesign from 'react-native-vector-icons/AntDesign';
import I18n from "react-native-i18n";
import {Overlay} from "teaset";
export default class ChoiceWallet extends Component {
  constructor(props) {
    super(props);
  }
  static navigationOptions = {
    header: null
  };

  // 状态
  state = {
    modalVisible:false,
    wallet:false,
    choice:false
  };


  componentDidMount(){

  }
  setLanguage(local){
    this.overlayPullLanguage.close()
    I18n.locale = local;
    storage.save({
      key: 'language',
      data: local,
    });
    this.props.navigation.replace('ChoiceWallet');
  }
  pullLanguage(){
    let overlayView = (
      <Overlay.PullView
        ref={v => this.overlayPullLanguage = v}
      >
        <View style={{width:WIDTH,backgroundColor: '#FFF'}}>
          <View>
            <View style={{justifyContent:'center',height:p(100),alignItems:'center',flexDirection:'row'}}>
              <Text style={{color: Theme.text_01,fontSize:p(30)}}>
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
  render() {
    return (
      <View style={styles.page}>
        <StatusBar
          barStyle={'light-content'}
          backgroundColor='transparent'
          translucent
        />
        <View style={{height: IOS ? p(125) : p(75)}}/>
        <View style={styles.header}>
          <View style={styles.headerSide}/>
          <TouchableOpacity style={styles.headerSide} onPress={() => this.pullLanguage()}>
            <Image
              resizeMode="contain"
              style={styles.langIcon}
              source={require('../../resource/image/nana/ico2.png')}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.hero}>
          <View style={styles.heroBox}>
            <Image
              resizeMode="contain"
              style={styles.heroImg}
              source={require('../../resource/image/spark/choice.png')}
            />
            <Text style={styles.logo}>SPARK</Text>
          </View>
        </View>
        <View style={styles.btnWrap}>
          <TouchableOpacity onPress={() => this.props.navigation.push('CreateWallet')}
                            style={styles.Touchable01}>
            <Text style={styles.Text02}>{lan.t('wallet.createWallet')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => this.props.navigation.push('ImportWallet')}
                            style={[styles.Touchable01, {marginTop: p(50)}]}>
            <Text style={styles.Text02}>{lan.t('wallet.importWallet')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }
}


const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#131313'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: p(28)
  },
  headerSide: {
    width: p(70),
    height: p(70),
    alignItems: 'flex-end',
    justifyContent: 'center'
  },
  langIcon: {
    width: p(62),
    height: p(62)
  },
  badge: {
    backgroundColor: '#1A1A1A',
    borderRadius: p(40),
    paddingHorizontal: p(28),
    paddingVertical: p(10)
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: p(22),
    fontWeight: '500'
  },
  logo: {
    position: 'absolute',
    top: p(40),
    left: 0,
    right: 0,
    color: Theme.buttonStyle,
    fontSize: p(88),
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: p(4)
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  heroBox: {
    width: WIDTH,
    height: WIDTH * 940 / 750,
    alignItems: 'center',
    justifyContent: 'center'
  },
  heroImg: {
    width: '100%',
    height: '100%'
  },
  btnWrap: {
    alignItems: 'center',
    paddingBottom: IOS ? p(150) : p(120)
  },
  Touchable01:{
    height: p(95),
    width:  WIDTH-p(80),
    backgroundColor: Theme.buttonStyle,
    borderRadius:p(50),
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row'
  },
  Text02:{
    color: '#131313',
    fontWeight:'700',
    fontSize:p(30),
    marginRight: p(10)
  },
  Text01:{
    color: '#FEFEFE',
    fontWeight:'500',
    fontSize:p(28)
  },
  text_01:{
    color:'#262626',
    fontSize:p(28),
    margin:p(10)
  },
  linearGradient2: {
    justifyContent:'space-between',
    flexDirection: 'row',
    alignItems:'center',
    borderBottomColor:'#f5f3f3',
    borderBottomWidth:p(1),
    height:p(125)
  },
  image_01:{
    width:p(55),
    height:p(55)
  },
  viewSty5:{width:WIDTH-p(100),flexDirection: 'row',alignItems:'center',justifyContent:'space-between'},
  viewSty4:{
    height:p(120),
    width:WIDTH-p(50),
    borderRadius:p(10),
    backgroundColor: 'rgba(23,23,56,0.59)',
    marginTop:p(30),
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
  linearGradient: {
    width: WIDTH-p(280),
    height: p(90),
    borderRadius: p(50),
    justifyContent:'center',
    alignItems:'center'
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

