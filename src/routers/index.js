/**
 * Created by zh on 2019/08/13.
 * 导航配置文件
 * router config file
 */
import React from 'react';
import { Platform, View, Text, Image, StyleSheet } from "react-native";
import {
  createAppContainer,
  createMaterialTopTabNavigator,
  createStackNavigator
} from 'react-navigation';
import StackViewStyleInterpolator from 'react-navigation-stack/src/views/StackView/StackViewStyleInterpolator';

import routerConfig from './routerConfig';//子路由页面

import MainPage from '../screens/MainPage';//钱包主页
import MyHome from '../screens/MyHome';//我的
import Find from '../screens/Find';//Find
import Quotation from '../screens/Quotation';//Quotation
import Bridgers from '../screens/Bridgers';//Quotation



import SystemIntroduction from '../screens/SystemIntroduction/index';
import Theme from '../styles/theme';
const TITLE_OFFSET = Platform.OS === 'ios' ? 70 : 56;

/**
 * 底部导航栏
 * Bottom navigation bar
 * @type {NavigationContainer}
 */
const Tabs = createMaterialTopTabNavigator(
  {
    MainPage: {
      screen: MainPage,
      navigationOptions: ({ navigation, screenProps }) => ({
        tabBarLabel: ({ focused }) => {
            return focused ? (
                <Text style={styles.icoSty}>
                    {lan.t('bottom.wallet')}
                </Text>
            ) : (
                <Text style={styles.unIcoSty}>
                    {lan.t('bottom.wallet')}
                </Text>
            );
        },
        tabBarIcon: ({ focused }) => {
          return focused ? (
            <Image style={{width: p(55),height: p(55)}}
                   source={require('../resource/image/nana/ico33.png')}/>
          ) : (
            <Image style={{width: p(55),height: p(55)}}
                   source={require('../resource/image/nana/ico34.png')}/>
          );
        }
      })
    },
      Quotation: {
          screen: Quotation,
          navigationOptions: ({ navigation, screenProps }) => ({
              tabBarLabel: ({ focused }) => {
                  return focused ? (
                    <Text style={styles.icoSty}>
                          {lan.t('bottom.quotation')}
                      </Text>
                  ) : (
                    <Text style={styles.unIcoSty}>
                          {lan.t('bottom.quotation')}
                      </Text>
                  );
              },
              tabBarIcon: ({ focused }) => {
                return focused ? (
                  <Image style={{width: p(55),height: p(55)}}
                         source={require('../resource/image/nana/ico37.png')}/>
                ) : (
                  <Image style={{width: p(55),height: p(55)}}
                         source={require('../resource/image/nana/ico38.png')}/>
                );
              }
          })
      },
    Bridgers: {
        screen: Bridgers,
            navigationOptions: ({ navigation, screenProps }) => ({
            tabBarLabel: ({ focused }) => {
                return focused ? (
                    <Text style={styles.icoSty}>
                        {lan.t('bottom.exchange')}
                    </Text>
                ) : (
                    <Text style={styles.unIcoSty}>
                        {lan.t('bottom.exchange')}
                    </Text>
                );
            },
            tabBarIcon: ({ focused }) => {
                return focused ? (
                    <Image style={{width: p(55),height: p(55)}}
                           source={require('../resource/image/spark/bridgers1.png')}/>
                ) : (
                    <Image style={{width: p(55),height: p(55)}}
                           source={require('../resource/image/spark/bridgers2.png')}/>
                );
            }
        })
    },
      Find: {
          screen: Find,
          navigationOptions: ({ navigation, screenProps }) => ({
              tabBarLabel: ({ focused }) => {
                  return focused ? (
                    <Text style={styles.icoSty}>
                          {lan.t('bottom.find')}
                      </Text>
                  ) : (
                    <Text style={styles.unIcoSty}>
                          {lan.t('bottom.find')}
                      </Text>
                  );
              },
              tabBarIcon: ({ focused }) => {
                return focused ? (
                  <Image style={{width: p(55),height: p(55)}}
                         source={require('../resource/image/nana/ico35.png')}/>
                ) : (
                  <Image style={{width: p(55),height: p(55)}}
                         source={require('../resource/image/nana/ico36.png')}/>
                );
              }
          })
      },
      MyHome: {
          screen: MyHome,
          navigationOptions: ({ navigation, screenProps }) => ({
              tabBarLabel: ({ focused }) => {
                  return focused ? (
                    <Text style={styles.icoSty}>
                          {lan.t('bottom.my')}
                      </Text>
                  ) : (
                    <Text style={styles.unIcoSty}>
                          {lan.t('bottom.my')}
                      </Text>
                  );
              },
              tabBarIcon: ({ focused }) => {
                return focused ? (
                  <Image style={{width: p(55),height: p(55)}}
                         source={require('../resource/image/nana/ico39.png')}/>
                ) : (
                  <Image style={{width: p(55),height: p(55)}}
                         source={require('../resource/image/nana/ico40.png')}/>
                );
              }
          })
      }
  },
  {
    animationEnabled: false, // 切换页面时是否有动画效果
    tabBarPosition: 'bottom', // 显示在底端，android 默认是显示在页面顶端的
    swipeEnabled: false, // 是否可以左右滑动切换tab
    lazy: true,
    tabBarOptions: {
      tabStyle: {
        maxHeight: p(150)
      },
      activeTintColor:  Theme.icoColor, // 文字和图片选中颜色
      inactiveTintColor: '#999', // 文字和图片未选中颜色
      pressOpacity: 0.8,
      showIcon: true, // android 默认不显示 icon, 需要设置为 true 才会显示
      indicatorStyle: {
        height: 0 // 如TabBar下面显示有一条线，可以设高度为0后隐藏
      },
      style: {
            backgroundColor: Theme.backgroundColor, // TabBar 背景色
      },
      labelStyle: {
            fontSize: p(28),
            marginTop: 3,
            marginBottom: 5,
            fontWeight:'500'
      },
    }
  }
);

/**
 * 自定义动画参数，通过在跳转页面中增加 transitionType: '类型' 来进行动画设置，默认 forHorizontal（从右往左）
 * @param sceneProps
 * @returns {*}
 * @constructor
 */
function TransitionConfiguration(sceneProps) {
  const { scene } = sceneProps;
  const { route } = scene;
  const params = route.params || {};
  const transitionType = params.transitionType;
  if (transitionType && transitionType !== '') {
    return StackViewStyleInterpolator[transitionType];
  } else {
    return StackViewStyleInterpolator.forHorizontal;
  }
}

/**
 * 路由表配置，第一个为启动时页面
 * Routing table configuration, the first one is the startup page
 * @type {NavigationContainer}
 */
const Router = createStackNavigator(
  {

    MainPage: {

      screen: Tabs,
        navigationOptions:{
            header:null,
        }
    },
    SystemIntroduction: {
      // 系统介绍界面
      screen: SystemIntroduction
    },
      ...routerConfig

  },
  {
    // 定义配置
    initialRouteName: 'SystemIntroduction', //设置初始路由为登录界面
    headerMode: 'screen',
    transitionConfig: sceneProps => ({
      /**
       * 1、从右向左：  forHorizontal；
       * 2、从下向上：  forVertical；
       * 3、安卓那种的从下向上： forFadeFromBottomAndroid；
       * 4、无动画：  forInitial。
       */
      screenInterpolator: TransitionConfiguration(sceneProps)
    }),
    defaultNavigationOptions: ({ navigation, screenProps }) => ({
      // 共享头部属性设置
      headerStyle: {
        backgroundColor: screenProps.themeColor,
        alignItems:'center'
      },
      headerBackTitle: null,
        headerLeftContainerStyle:{
            top: Platform.OS === 'ios' ? 0 : p(30),
            left: Platform.OS === 'ios' ? 0 : -p(20),
        },
      headerTintColor: screenProps.titleColor,
      headerTitleStyle: {
          alignSelf: 'center',
          textAlign: 'center',
          flex: 1,
          fontWeight: 'bold',
          fontSize: p(30)
      },
        headerTitleContainerStyle: {
            left: TITLE_OFFSET,
            right: TITLE_OFFSET,
            top:Platform.OS === 'ios' ? 0 : p(25)
        },
    })
  }
);

/**
 * 外层包裹，3.x不允许直接导出路由
 * Outer parcel, 3.x does not allow direct export routing
 * @type {NavigationContainer}
 */
const RootStack = createAppContainer(Router);

const styles = StyleSheet.create({
  icoSty: {
    color:Theme.icoColor,
    fontSize:p(26),
    marginTop: p(6),
    marginBottom: Platform.OS === 'ios'?p(20):0
  },
  unIcoSty: {
    color:Theme.tabUnSelected,
    fontSize:p(26),
    marginTop: p(6),
    marginBottom: Platform.OS === 'ios'?p(20):0
  },
})
module.exports = RootStack;
