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
  Platform, Clipboard,
} from "react-native" ;
import LinearGradient from 'react-native-linear-gradient';
import AntDesign from 'react-native-vector-icons/AntDesign';
import I18n from "react-native-i18n";
import {Overlay} from "teaset";
import {Head} from '../../common/Head';
import QRCode from "react-native-qrcode-svg";
export default class InviteFriend extends Component {
  constructor(props) {
    super(props);
  }
  static navigationOptions = {
    header: null
  };

  // 状态
  state = {

  };


  componentDidMount(){

  }
  copyAddress(){
    Toast.success(lan.t('all.copyAddress'));
    Clipboard.setString(walletAddress);
  }
  // 渲染
  render() {
    return (
        <ImageBackground
            resizeMode="stretch"
            source={require('../../resource/image/spark/invite.png')}
            style={{flex:1}}>
          <Head leftOnPress={()=>this.props.navigation.goBack()}/>
          <View style={{justifyContent: 'center',alignItems: 'center',marginTop: p(80)}}>
            <View style={{flexDirection: 'row',alignItems: 'center'}}>
              <Image style={{width: p(100),height: p(100)}} source={require('../../resource/image/spark/spark.png')}/>
              <Text style={{fontSize: p(55),fontWeight: '500',color: Theme.textColor,marginLeft: p(20)}}>
                SPARK
              </Text>
            </View>
            <Text style={{fontSize: p(45),fontWeight: '500',color: Theme.textColor,marginTop: p(50)}}>
              {lan.t('nana.siyaozichi')}
            </Text>
            <Text style={{fontSize: p(24),color: '#515151',marginTop: p(20)}}>
              {lan.t('nana.tansuozuixinng')}
            </Text>

            <View style={{marginTop:p(50),backgroundColor: '#FFFFFF',borderRadius: p(50),
              width: WIDTH-p(300),height: p(450),justifyContent: 'center',alignItems: 'center'}}>
              <QRCode
                value="https://download.sparkfh.xyz/download.html"
                backgroundColor={"#FFFFFF"}
                size={p(360)}
                logoSize={50}
              />
            </View>
            <Text style={{fontSize: p(26),color: '#000000',marginTop: p(30)}}>
              {lan.t('nana.erweima')}
            </Text>

            {/*<View style={{marginTop:p(280),backgroundColor: '#FFFFFF',borderRadius: p(50),
              width: WIDTH-p(50),height: p(100),justifyContent: 'space-between',flexDirection: 'row',
              alignItems: 'center'}}>

              <TouchableOpacity
                  onPress={()=>this.copyAddress()}
                  style={{justifyContent: 'space-between',flexDirection: 'row',marginLeft: p(90)}}>
                <AntDesign
                    name='link'
                    size={19}
                    color={'#20325a'}
                />
                <Text>复制链接</Text>
              </TouchableOpacity>

              <TouchableOpacity
                  onPress={()=>this.copyAddress()}
                  style={{justifyContent: 'space-between',flexDirection: 'row',marginRight: p(90)}}>
                <AntDesign
                    name='down'
                    size={19}
                    color={'#20325a'}
                />
                <Text>保存图片</Text>
              </TouchableOpacity>

            </View>*/}
          </View>

        </ImageBackground>

    )
  }
}


const styles = StyleSheet.create({

});

