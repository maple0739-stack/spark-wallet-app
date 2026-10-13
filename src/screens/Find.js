/**
 * Created by zh on 2019/08/08.
 * 我的页面
 * my page
 */
import React, { Component } from 'react';
import {
  View, Image, ScrollView, StyleSheet, StatusBar, ImageBackground, Text, TouchableOpacity,
  Linking, Platform,
} from "react-native";
import AntDesign from "react-native-vector-icons/AntDesign";
import {Input} from "react-native-elements";
import Swiper from 'react-native-swiper';
import I18n from "react-native-i18n";
export default class Find extends Component {
  constructor(props) {
    super(props);
  }
  state={
      DappList:[]
  }
  componentDidMount() {
      storage.load({
          key: 'DappUrl'
      }).then(data => {
          this.setState({
              DappList:data
          })
      })
  }
  getDappBrowser(browserUrl){
      this.props.navigation.push('DappBrowser',{browserUrl:browserUrl})
  }
  getNextPage(pageUrl){
      this.props.navigation.push(pageUrl)
  }
  render() {
    return (
        <View style={{flex:1,backgroundColor: Theme.backgroundColor}}>
            <View style={{alignItems:'center',justifyContent:'center',marginTop:Platform.OS === 'ios'?p(100):p(70)}}>
                <View style={{justifyContent:'space-between',alignItems:'center',flexDirection:'row',width:WIDTH-p(20)}}>
                    <View style={{width: WIDTH-p(100)}}>
                        <Input
                          leftIcon={{
                              type: 'antdesign',
                              name: 'search1',
                              color: '#acabab',
                              size: p(40)
                          }}
                          leftIconContainerStyle={{marginLeft: p(10)}}
                          onFocus={()=>this.props.navigation.push('DappIndex')}
                          placeholder={lan.t('news.shousuodapp')}
                          inputStyle={{color:'#373735',fontSize:p(28),fontWeight:'500',
                              marginLeft:p(20)}}
                          inputContainerStyle={{borderWidth:p(0),borderRadius: p(10),
                              height:p(75),borderBottomColor: '#c4c4c4'}}
                          onChangeText={(code) => this.setState({code})}
                        />
                    </View>
                    <Image source={require('../resource/image/nana/ico15.png')}
                           style={{width: p(65),height: p(65),marginRight:p(20)}}/>

                </View>
            </View>
            <View style={{height: p(330)}}>
                <Swiper style={{marginTop:p(30)}}
                        horizontal={true}
                        removeClippedSubviews={false}
                        showsPagination={false}
                        showsButtons={false}
                        autoplay={true}                //自动轮播
                        autoplayTimeout={3}          //每隔3秒切换
                >
                    <Image resizeMode="stretch" style={styles.image} source={
                        I18n.locale === 'zh'
                            ? require('../resource/image/spark/ban1.png')
                            : require('../resource/image/spark/ban4.jpg')
                    }/>
                </Swiper>
            </View>
            <ScrollView>
                <View>
                    <View style={{marginLeft:p(25),flexDirection: 'row'}}>
                        <TouchableOpacity>
                          <Text style={{color:'#0D1C3D',fontSize:p(28),fontWeight:'500'}}>
                            {lan.t('nana.remen')}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{marginLeft: p(30)}}>
                          <Text style={{color:'#9FA0A3',fontSize:p(28),fontWeight:'500'}}>
                            {lan.t('nana.wode')}
                          </Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{justifyContent:'center',alignItems:'center',marginTop: p(20)}}>
                        <View style={{flexDirection:'row',flexWrap:'wrap',width:WIDTH}}>

                          <TouchableOpacity
                              onPress={()=>this.getDappBrowser('https://sparkfh.xyz/')}
                            style={styles.View_05}>
                            <Image
                              source={require('../resource/image/spark/spark.png')} style={styles.ImageSty}/>
                            <Text style={styles.Text_03}>
                              Spark
                            </Text>
                          </TouchableOpacity>

                            <TouchableOpacity
                              onPress={()=>this.getDappBrowser('https://pancakeswap.finance/swap')}
                              style={styles.View_05}>
                                <Image source={require('../resource/image/dapp/pancakeswap.png')} style={[styles.ImageSty]}/>
                              <Text style={styles.Text_03}>
                                PancakeSwap
                              </Text>
                            </TouchableOpacity>

                          <TouchableOpacity
                            onPress={()=>this.getDappBrowser('https://app.uniswap.org/swap')}
                            style={styles.View_05}>
                            <Image source={require('../resource/image/spark/uniswap.png')} style={[styles.ImageSty]}/>
                            <Text style={styles.Text_03}>
                              UniSwap
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                              onPress={()=>this.getDappBrowser('https://opensea.io/')}
                              style={styles.View_05}>
                            <Image source={require('../resource/image/dapp/opensea.png')} style={[styles.ImageSty]}/>
                            <Text style={styles.Text_03}>
                              OpenSea
                            </Text>
                          </TouchableOpacity>

                        </View>
                      {/*<View style={{marginTop: p(20),width: WIDTH-p(30),justifyContent: 'space-between',alignItems: 'center',flexDirection: 'row'}}>
                        <Image source={require('../resource/image/spark/ban2.png')}
                               style={{width: WIDTH/2.15,height: p(150),borderRadius: p(10)}}/>
                        <Image source={require('../resource/image/spark/ban3.png')}
                               style={{width: WIDTH/2.15,height: p(150),borderRadius: p(10)}}/>
                      </View>*/}
                    </View>






                  <View style={{marginTop: p(50),marginLeft: p(25),width: WIDTH-p(50),
                    flexDirection: 'row',justifyContent: 'space-between',alignItems: 'center'}}>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                      <Image style={{width: p(35),height: p(35)}} source={require('../resource/image/nana/ico21.png')}/>
                      <View style={{marginLeft: p(10)}}>
                        <Text style={{
                          color: '#0D1C3D',
                          fontSize: p(28),
                          fontWeight: '500',
                        }}>MEME</Text>
                      </View>
                    </View>
                    <View style={{flexDirection: 'row'}}>
                      <Text style={{
                        color: '#808080',
                        fontSize: p(24)}}>
                        {lan.t('nana.gengduo')}
                      </Text>
                      <AntDesign
                        name='right'
                        size={14}
                        color={'#b3b2b2'}
                      />
                    </View>
                  </View>
                  <Text style={{
                    color: '#a3a2a2',
                    fontSize: p(24),
                    marginTop: p(6),
                    marginLeft: p(20)}}>
                    {lan.t('nana.tansuozuixinng')}
                  </Text>


                  <TouchableOpacity
                    onPress={()=>this.getDappBrowser('https://four.meme/')}
                    style={{marginLeft: p(20),marginTop: p(30), flexDirection: 'row', alignItems: 'center'}}>
                    <Image style={{width: p(65),height: p(65)}} source={require('../resource/image/nana/ico43.png')}/>
                    <View style={{marginLeft: p(10)}}>
                      <View style={{flexDirection: 'row',alignItems:'center'}}>
                        <Text style={{
                          color: '#0D1C3D',
                          fontSize: p(26),
                        }}>Four.Meme</Text>
                        <View style={styles.popularStyle}>
                          <Text style={{color: '#0080FF',fontSize:p(22),margin: p(6)}}>
                            {lan.t('nana.remen')}
                          </Text>
                        </View>
                      </View>
                      <Text style={{
                        color: '#808080',
                        fontSize: p(22),
                        marginTop: p(6)}}>
                        {lan.t('nana.diyigefaxingpingtai')}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={()=>this.getDappBrowser('https://gmgn.ai/?chain=bsc')}
                    style={{marginLeft: p(20),marginTop: p(30), flexDirection: 'row', alignItems: 'center'}}>
                    <Image style={{width: p(65),height: p(65)}} source={require('../resource/image/nana/ico44.png')}/>
                    <View style={{marginLeft: p(10)}}>
                      <View style={{flexDirection: 'row',alignItems:'center'}}>
                        <Text style={{
                          color: '#0D1C3D',
                          fontSize: p(26),
                        }}>GMGN.AI</Text>
                        <View style={styles.popularStyle}>
                          <Text style={{color: '#0080FF',fontSize:p(22),margin: p(6)}}>
                            {lan.t('nana.remen')}
                          </Text>
                        </View>
                      </View>
                      <Text style={{
                        color: '#808080',
                        fontSize: p(22),
                        marginTop: p(6)}}>
                        {lan.t('nana.jiaoyishenqi')}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/*<TouchableOpacity
                    onPress={()=>this.getDappBrowser('https://pump.fun/')}
                    style={styles.Sty1}>
                    <Image style={styles.Sty5} source={require('../resource/image/nana/ico63.png')}/>
                    <View style={styles.Sty2}>
                      <View style={styles.Sty6}>
                        <Text style={styles.Sty3}>PUMP</Text>
                      </View>
                      <Text style={styles.Sty4}>
                        {lan.t('nana.f1')}
                      </Text>
                    </View>
                  </TouchableOpacity>*/}

                  <TouchableOpacity
                    onPress={()=>this.getDappBrowser('https://debot.ai/')}
                    style={styles.Sty1}>
                    <Image style={styles.Sty5} source={require('../resource/image/nana/ico64.png')}/>
                    <View style={styles.Sty2}>
                      <View style={styles.Sty6}>
                        <Text style={styles.Sty3}>Debot</Text>
                      </View>
                      <Text style={styles.Sty4}>
                        {lan.t('nana.f2')}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={()=>this.getDappBrowser('https://www.dextools.io/app/')}
                    style={styles.Sty1}>
                    <Image style={styles.Sty5} source={require('../resource/image/nana/ico65.png')}/>
                    <View style={styles.Sty2}>
                      <View style={styles.Sty6}>
                        <Text style={styles.Sty3}>DexTools</Text>
                      </View>
                      <Text style={styles.Sty4}>
                        {lan.t('nana.f3')}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={()=>this.getDappBrowser('https://birdeye.so/')}
                    style={styles.Sty1}>
                    <Image style={styles.Sty5} source={require('../resource/image/nana/ico66.png')}/>
                    <View style={styles.Sty2}>
                      <View style={styles.Sty6}>
                        <Text style={styles.Sty3}>Birdeye</Text>
                      </View>
                      <Text style={styles.Sty4}>
                        {lan.t('nana.f4')}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={()=>this.getDappBrowser('https://dexscreener.com/')}
                    style={styles.Sty1}>
                    <Image style={styles.Sty5} source={require('../resource/image/nana/ico67.png')}/>
                    <View style={styles.Sty2}>
                      <View style={styles.Sty6}>
                        <Text style={styles.Sty3}>DexScreener</Text>
                      </View>
                      <Text style={styles.Sty4}>
                        {lan.t('nana.f5')}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={()=>this.getDappBrowser('https://photon-sol.tinyastro.io/')}
                    style={styles.Sty1}>
                    <Image style={styles.Sty5} source={require('../resource/image/nana/ico54.png')}/>
                    <View style={styles.Sty2}>
                      <View style={styles.Sty6}>
                        <Text style={styles.Sty3}>Photon</Text>
                      </View>
                      <Text style={styles.Sty4}>
                        {lan.t('nana.f6')}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={()=>this.getDappBrowser('https://backup.bullx.io/')}
                    style={styles.Sty1}>
                    <Image style={styles.Sty5} source={require('../resource/image/nana/ico55.png')}/>
                    <View style={styles.Sty2}>
                      <View style={styles.Sty6}>
                        <Text style={styles.Sty3}>BullX</Text>
                      </View>
                      <Text style={styles.Sty4}>
                        {lan.t('nana.f7')}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={()=>this.getDappBrowser('https://jup.ag/')}
                    style={styles.Sty1}>
                    <Image style={styles.Sty5} source={require('../resource/image/nana/ico57.png')}/>
                    <View style={styles.Sty2}>
                      <View style={styles.Sty6}>
                        <Text style={styles.Sty3}>Jupiter</Text>
                      </View>
                      <Text style={styles.Sty4}>
                        {lan.t('nana.f8')}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={()=>this.getDappBrowser('https://raydium.io/swap/')}
                    style={styles.Sty1}>
                    <Image style={styles.Sty5} source={require('../resource/image/nana/ico58.png')}/>
                    <View style={styles.Sty2}>
                      <View style={styles.Sty6}>
                        <Text style={styles.Sty3}>Raydium</Text>
                      </View>
                      <Text style={styles.Sty4}>
                        {lan.t('nana.f9')}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={()=>this.getDappBrowser('https://www.orca.so/')}
                    style={styles.Sty1}>
                    <Image style={styles.Sty5} source={require('../resource/image/nana/ico59.png')}/>
                    <View style={styles.Sty2}>
                      <View style={styles.Sty6}>
                        <Text style={styles.Sty3}>Orca</Text>
                      </View>
                      <Text style={styles.Sty4}>
                        {lan.t('nana.f10')}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={()=>this.getDappBrowser('https://app.uniswap.org/swap')}
                    style={styles.Sty1}>
                    <Image style={styles.Sty5} source={require('../resource/image/nana/ico60.png')}/>
                    <View style={styles.Sty2}>
                      <View style={styles.Sty6}>
                        <Text style={styles.Sty3}>Uniswap</Text>
                      </View>
                      <Text style={styles.Sty4}>
                        {lan.t('nana.f11')}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={()=>this.getDappBrowser('https://pancakeswap.finance/swap')}
                    style={styles.Sty1}>
                    <Image style={styles.Sty5} source={require('../resource/image/nana/ico61.png')}/>
                    <View style={styles.Sty2}>
                      <View style={styles.Sty6}>
                        <Text style={styles.Sty3}>PancakeSwap</Text>
                      </View>
                      <Text style={styles.Sty4}>
                        {lan.t('nana.f12')}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={()=>this.getDappBrowser('https://www.sushi.com/ethereum/swap')}
                    style={styles.Sty1}>
                    <Image style={styles.Sty5} source={require('../resource/image/nana/ico62.png')}/>
                    <View style={styles.Sty2}>
                      <View style={styles.Sty6}>
                        <Text style={styles.Sty3}>SushiSwap</Text>
                      </View>
                      <Text style={styles.Sty4}>
                        {lan.t('nana.f13')}
                      </Text>
                    </View>
                  </TouchableOpacity>

                </View>
              <View style={{height: p(50)}}/>
            </ScrollView>
        </View>
    );
  }
}

const styles = StyleSheet.create({
    ImageSty:{

        width:p(80),
        height:p(80)
    },
    Text_03:{
        fontSize:p(22),
        color:'#2b2a2a',
        marginTop:p(20)
    },
    View_05:{
        justifyContent:'center',
        alignItems:'center',
        width:WIDTH/4,
        height:p(180),
    },
    image:{
       width:WIDTH-p(50),
       height:p(270),
        marginLeft:p(25),
        borderRadius:p(10)
    },

    TextSty:{
        color:'#3F3F3F',
        fontSize:p(28),
        fontWeight:'500'
    },
  popularStyle:{
    borderColor: '#0080FF',
    borderWidth: p(1),
    alignItems:'center',
    justifyContent:'center',
    borderRadius: p(10),
    marginLeft: p(20)
  },
  Sty1: {marginLeft: p(20),marginTop: p(30), flexDirection: 'row', alignItems: 'center'},
  Sty2: {marginLeft: p(10),width: WIDTH-p(120)},
  Sty3: {color: '#0D1C3D',fontSize: p(26)},
  Sty4: {color: '#808080',fontSize: p(22),marginTop: p(6)},
  Sty5: {width: p(65),height: p(65)},
  Sty6: {flexDirection: 'row',alignItems:'center'}
})
