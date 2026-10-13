/**
 * Created by zh on 2019/08/21.
 * 系统功能介绍界面，可以用做第一次进入系统的首屏
 * System function introduction page, Can be used as the first screen to enter the system for the first time
 */
import React, { Component } from 'react';
import { View, Text, StatusBar } from 'react-native';
import Swiper from 'react-native-swiper';
import { Button } from 'react-native-elements';
import { FIRST_INSTALL } from '../../common/redux/action/settingActionTypes';
import { connect } from 'react-redux';
import * as Animatable from 'react-native-animatable';
import commonStyles from '../../styles/commonStyles';
import constants from '../../common/constants';
class SystemIntroduction extends Component {
  static navigationOptions = {
    header: null
  };

  constructor(props) {
    super(props);
    this.state = {
      introductionMap: [
      ]
    };
  }

  // 组件加载之前就判断是否是第一次启动
  componentWillMount() {
   this.getPage();
  }
  getPage(){
    storage.load({
      key: 'UseWallet'
    }).then(data => {
      this.props.navigation.replace('MainPage');
      //this.props.navigation.replace('ChoiceWallet');
    }).catch(data=>{
      this.props.navigation.replace('ChoiceWallet');
    })
  }

  render() {
    return (
      <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
        <StatusBar
            barStyle={'light-content'}
            backgroundColor='transparent'
            translucent
        />
      </View>
    );
  }
}

// 取出 store 中的数据
const mapStateToProps = state => {
  return {
    firstInstall: state.SettingReducer.firstInstall
  };
};

// Dispatch 方法
const mapDispatchToProps = dispatch => {
  return {
    setFirstInstall: firstInstall => {
      dispatch({ type: FIRST_INSTALL, firstInstall: firstInstall });
    }
  };
};

export default (SystemIntroduction = connect(
  mapStateToProps,
  mapDispatchToProps
)(SystemIntroduction));
