/**
 * Created by zh on 2019/08/12.
 * 版本信息页面
 * version info page
 */
import React, { Component } from 'react';
import {View, Clipboard, Text, Linking} from 'react-native';
import {Button, ListItem} from 'react-native-elements';
import Theme from '../../../../styles/theme';
import DeviceInfo from 'react-native-device-info';
import commonStyles from '../../../../styles/commonStyles';
import {Overlay} from "teaset";

const list = [
  {
    key: 0,
    title: lan.t('sett.appName'),
    rightTitle: DeviceInfo.getApplicationName()
  },
  {
    key: 1,
    title: lan.t('sett.version'),
    rightTitle: appVersion
  },
  {
    key: 2,
    title: lan.t('sett.author'),
    rightTitle: 'hammer'
  },
  {
    key: 3,
    title: lan.t('sett.email'),
    rightTitle: 'info@hammer.com',
    onPress: text => {
      Toast.success(lan.t('sett.copyEmail'));
      Clipboard.setString(text);
    }
  }
];

export default class VersionInfo extends Component {
  static navigationOptions = {
    headerTitle: lan.t('sett.info')
  };

  constructor(props) {
    super(props);
  }
  state={
    app_version:0,
    content:'',
    android_url:'',
    ios_url:''
  }

  componentDidMount() {
  }

  //立即更新
  renewButton(){
    //判断是IOS还是Android
    if(IOS){
      Linking.openURL(this.state.ios_url);
    }else{
      Linking.openURL(this.state.android_url);
    }
  }

  getVersion(){

  }
  //app版本更新提示
  showAppVersionPull() {
    let overlayView = (
        <Overlay.PopView
            ref={v => this.overlayPullView = v}
            style={{alignItems: 'center', justifyContent: 'center'}}
        >
          <View style={{backgroundColor: '#fff', minWidth: WIDTH-p(100), minHeight: p(500), borderRadius: p(10)}}>

            <View style={{alignItems:'center',justifyContent:'center',flexDirection:'row',height:p(100),borderBottomWidth:p(1),
              borderBottomColor:'#efefef'}}>
              <Text style={{color:'#282828',fontSize:p(32),fontWeight:'500'}}>
                BetBeb {lan.t('sett.updateVersion')}
              </Text>
            </View>
            <View style={{marginTop:p(20),marginLeft:p(30)}}>
              <Text style={{fontSize:p(28),color:'#282828',lineHeight:p(40)}}>
                {lan.t('sett.disVersion')} {this.state.app_version} {lan.t('sett.updateNot')}？
              </Text>
              <Text style={{fontSize:p(26),color:'#393939',lineHeight:p(70)}}>
                {this.state.content}
              </Text>
            </View>

            <View style={{alignItems:'center',justifyContent:'center',marginTop:p(150)}}>
              <View style={{alignItems:'center',justifyContent:'space-between',flexDirection:'row',width:WIDTH-p(150)}}>
                <Button
                    buttonStyle={{backgroundColor:'#efefef',height:buttonHeight,width:p(280)}}
                    titleStyle={{color:'#4b4b4b'}}
                    title={lan.t('sett.laterUpdate')}
                    onPress={() => this.overlayPullView && this.overlayPullView.close()}/>
                <Button
                    buttonStyle={{backgroundColor:themeColor,height:buttonHeight,width:p(280)}}
                    title={lan.t('sett.toUpdate')}
                    onPress={()=> this.renewButton()}
                />
              </View>
            </View>

          </View>
        </Overlay.PopView>
    );
    Overlay.show(overlayView);
  }

  render() {
    return (
      <View style={{ flex: 1, backgroundColor: Theme.commonBackColor }}>
        {list.map((item, i) => (
          <ListItem
            key={i}
            onPress={() =>
              item.onPress ? item.onPress(item.rightTitle) : console.log('')
            }
            rightTitleStyle={{ width: 170, textAlign: 'right' }}
            title={item.title}
            containerStyle={commonStyles.itemPadding}
            bottomDivider={true}
            rightTitle={item.rightTitle}
          />
        ))}

        <View style={{alignItems:'center',justifyContent:'center',marginTop:p(130)}}>
          <Button
              buttonStyle={{backgroundColor:themeColor,height:buttonHeight,width:buttonWidth}}
              title={lan.t('sett.newVersion')}
              onPress={()=>this.getVersion()}
          />
        </View>

      </View>
    );
  }
}
