/**
 * Created by zh. on 2019/09/01.
 */

import React, {Component} from 'react';
import {
    StyleSheet, Alert,
    View,
    Text, TouchableOpacity, ImageBackground, TextInput, Image, Clipboard, StatusBar,
} from 'react-native' ;
import AntDesign from "react-native-vector-icons/AntDesign";
import QRCode from 'react-native-qrcode-svg';
import {Button} from '../../common/Button';
import {Head} from '../../common/Head';
export default class Receive extends Component {
    constructor(props) {
        super(props);
    }
    static navigationOptions =  ({ navigation }) =>({
        header: null
    });
    // 状态
    state = {
    };

    componentDidMount(){


    }
    //复制地址
    copyAddress(){
        Toast.success(lan.t('all.copyAddress'));
        Clipboard.setString(walletAddress);
    }
    // 渲染
    render() {
        return (
            <View style={{ flex: 1, backgroundColor: Theme.backgroundColor }}>

                <Head
                    text= {lan.t('pcd.skm')}
                    leftOnPress={()=>this.props.navigation.goBack()}
                />

                <View style={{justifyContent:'center',alignItems:'center'}}>

                    <View style={{borderRadius:p(10),marginTop:p(50),width:WIDTH-p(50),justifyContent:'center',
                        alignItems:'center',height:p(85),backgroundColor:'#FFCF4021'}}>
                        <View style={{width:WIDTH-p(160),flexDirection:'row',alignItems:'center'}}>
                            <AntDesign
                              name='exclamationcircleo'
                              size={18}
                              color='#FFC015'
                              style={{left:-p(20)}}
                            />
                            <Text style={{fontSize:p(26),color:'#FFC015',lineHeight:p(40),fontWeight: '500'}}>
                                {lan.t('news.dizhifukuan')}
                            </Text>
                        </View>
                    </View>

                    <View style={{justifyContent:'center',alignItems:'center',width:WIDTH-p(50),
                        backgroundColor:'#F5F6F8',borderRadius:p(20),marginTop: p(30)}}>
                        <Text style={{fontSize:p(26),color: Theme.textColor,marginTop:p(40),fontWeight: '500'}}>
                            {lan.t('news.shoukuandizhi')}
                        </Text>
                        <View style={{marginTop:p(50)}}>
                            <QRCode
                                value={walletAddress}//二维码内容
                                backgroundColor={"#ffffff"}//背景色
                                size={p(450)}//二维码宽高
                                logo={require('../../resource/image/spark/spark.png')}
                                logoSize={50}
                            />
                        </View>
                        <View style={{borderRadius:p(10),marginTop:p(50),width:WIDTH-p(150),justifyContent:'center',
                            alignItems:'center'}}>
                            <View style={{width:WIDTH-p(200),alignItems:'center'}}>
                                <Text style={{fontSize:p(30),color: Theme.textColor,marginTop:p(20),
                                    marginBottom: p(50),fontWeight: '500'}}>
                                    {walletAddress}
                                </Text>
                            </View>
                        </View>

                    </View>

                    <Button
                      text={ lan.t('tt.copyAddress')}
                      onPress={()=>this.copyAddress()}
                    />

                </View>
            </View>
        )
    }
}


const styles = StyleSheet.create({

});

