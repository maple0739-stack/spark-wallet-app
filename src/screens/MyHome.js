/**
 * Created by zh on 2019/08/08.
 * 我的页面
 * my page
 */
import React, { Component } from 'react';
import {
    View, StyleSheet, Text, TouchableOpacity, Image,

} from "react-native";
import AntDesign from "react-native-vector-icons/AntDesign";
import Entypo from 'react-native-vector-icons/Entypo';
import { Images } from "../resource";

export default class MyHome extends Component {
    constructor(props) {
        super(props);
    }
    leftTouch(){
        return(
            <Entypo
                name='chevron-with-circle-right'
                size={20}
                color={'#c8c7c7'}
                style={{marginRight:p(20)}}
            />
        )
    }
    render() {
        return (
            <View style={{flex:1,backgroundColor:Theme.backgroundColor}}>

                <View style={{alignItems:'center',justifyContent:'center',marginTop:p(80)}}>
                    <View style={{justifyContent:'space-between',alignItems:'center',flexDirection:'row',width:WIDTH-p(50)}}>
                        <View style={{flexDirection:'row',alignItems:'center'}}>
                            <Image
                              source={Images.token[useChainInfo.chainSymbol]}
                              style={{width: p(45),height: p(45)}}
                            />
                            <Text style={{color:'#060605',fontSize:p(28),marginLeft:p(10)}}>
                                {useChainInfo && useChainInfo.chainName}
                            </Text>
                        </View>

                        <View style={{flexDirection: 'row',alignItems:'center'}}>
                            <TouchableOpacity onPress={()=>this.props.navigation.push('ManageWallet')}>
                                <Image style={{width: p(65),height: p(65)}}
                                       source={require('../resource/image/nana/ico6.png')}/>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={{marginLeft: p(20)}}
                              onPress={()=>this.props.navigation.push('ScanScreen',{useChainInfo: useChainInfo})}>
                                <Image style={{width: p(65),height: p(65)}}
                                       source={require('../resource/image/nana/ico5.png')}/>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
                <View style={{marginTop: p(50),marginLeft: p(20),flexDirection: 'row',alignItems: 'center'}}>
                    <Image style={{width: p(100),height: p(100)}}
                           source={require('../resource/image/spark/spark.png')}/>
                    <View style={{marginLeft: p(10)}}>
                        <Text style={{color: Theme.textColor,fontSize: p(26),fontWeight: '500'}}>
                            Spark
                        </Text>
                        <Text style={{color: '#555555',fontSize: p(24),marginTop: p(6)}}>
                            Deck
                        </Text>
                    </View>
                </View>

                <View style={{width:WIDTH,height:p(1),backgroundColor:'#eae9e9',marginTop:p(50)}}/>

                <View style={{backgroundColor:'#FFFFFF',marginTop:p(50)}}>
                    <Text style={{color: Theme.textColor,fontSize: p(26),marginLeft: p(20),marginBottom: p(20)}}>
                        {lan.t('nana.zhanghu')}
                    </Text>
                    <TouchableOpacity
                        onPress={()=>this.props.navigation.push('ManageWallet')}
                        style={styles.TouchableOpacitySty}>
                        <View style={{flexDirection:'row',alignItems:'center'}}>
                            <Image style={{width: p(50),height: p(50),marginLeft:p(20)}}
                                   source={require('../resource/image/nana/ico22.png')}/>
                            <Text style={styles.TextSty}>
                                {lan.t('my.manageWallet')}
                            </Text>
                        </View>
                        {this.leftTouch()}
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={()=>this.props.navigation.push('AddressBook')}
                        style={styles.TouchableOpacitySty}>
                        <View style={{flexDirection:'row',alignItems:'center'}}>
                            <Image style={{width: p(50),height: p(50),marginLeft:p(20)}}
                                   source={require('../resource/image/nana/ico23.png')}/>
                            <Text style={styles.TextSty}>
                                {lan.t('news.dizhibu')}
                            </Text>
                        </View>
                        {this.leftTouch()}
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={()=>this.props.navigation.push('Password')}
                      style={styles.TouchableOpacitySty}>
                        <View style={{flexDirection:'row',alignItems:'center'}}>
                            <Image
                              resizeMode="stretch"
                              style={{width: p(50),height: p(50),marginLeft:p(20)}}
                              source={require('../resource/image/nana/ico24.png')}/>
                            <Text style={styles.TextSty}>
                                {lan.t('pay.zhifumima')}
                            </Text>
                        </View>
                        {this.leftTouch()}
                    </TouchableOpacity>

                    <View style={{width:WIDTH,height:p(1),backgroundColor:'#eae9e9',marginTop:p(30)}}/>


                    <Text style={{color: Theme.textColor,fontSize: p(26),
                        marginLeft: p(20),marginBottom: p(20),marginTop: p(40)}}>
                        {lan.t('nana.xitong')}
                    </Text>

                    <TouchableOpacity
                      onPress={()=>this.props.navigation.push('Settings')}
                      style={styles.TouchableOpacitySty}>
                        <View style={{flexDirection:'row',alignItems:'center'}}>
                            <Image style={{width: p(50),height: p(50),marginLeft:p(20)}}
                                   source={require('../resource/image/nana/ico27.png')}/>
                            <Text style={styles.TextSty}>
                                {lan.t('language.set')}
                            </Text>
                        </View>
                        {this.leftTouch()}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.TouchableOpacitySty}>
                        <View style={{flexDirection:'row',alignItems:'center'}}>
                            <Image style={{width: p(50),height: p(50),marginLeft:p(20)}}
                                   source={require('../resource/image/nana/ico25.png')}/>
                            <Text style={styles.TextSty}>
                                {lan.t('nana.xitongtongzhi')}
                            </Text>
                        </View>
                        {this.leftTouch()}
                    </TouchableOpacity>

                   {/* <TouchableOpacity
                      style={styles.TouchableOpacitySty}>
                        <View style={{flexDirection:'row',alignItems:'center'}}>
                            <Image style={{width: p(50),height: p(50),marginLeft:p(20)}}
                                   source={require('../resource/image/nana/ico26.png')}/>
                            <Text style={styles.TextSty}>
                                {lan.t('nana.guanyuwomen')}
                            </Text>
                        </View>
                        {this.leftTouch()}
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={()=>this.props.navigation.push('Settings')}
                      style={styles.TouchableOpacitySty}>
                        <View style={{flexDirection:'row',alignItems:'center'}}>

                            <AntDesign
                              name='laptop'
                              size={24}
                              color={'#F3C640'}
                              style={{marginLeft:p(25)}}
                            />

                            <Text style={styles.TextSty}>
                                {lan.t('nana.xitongbanben')}
                            </Text>
                        </View>
                        <Text style={{marginRight: p(20),fontSize: p(26),color: '#656565'}}>
                            V{appVersion}
                        </Text>
                    </TouchableOpacity>*/}
                </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    TouchableOpacitySty:{
        flexDirection:'row',
        justifyContent:'space-between',
        alignItems:'center',
        height:p(100),

    },
    TextSty:{
        color:'#0D1C3D',
        fontSize:p(28),
        marginLeft:p(10)
    },
})
