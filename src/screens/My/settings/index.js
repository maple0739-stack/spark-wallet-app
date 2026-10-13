/**
 * Created by zh on 2019/08/12.
 * 设置页面
 * settings page
 */
import React, { Component } from 'react';
import { View,Switch,Text } from 'react-native';
import { ListItem } from 'react-native-elements';
import Theme from '../../../styles/theme';
import commonStyles from '../../../styles/commonStyles';

const list = [
  {
    key: 1,
    title: lan.t('sett.info'),
    onPress: navigation => navigation.push('VersionInfo')
  },
  {
    key: 2,
    title: lan.t('sett.skin'),
    onPress: navigation => {
      navigation.push('ThemeChange', {
        transitionType: 'forFadeToBottomAndroid'
      });
    }
  }
];

export default class Settings extends Component {
  static navigationOptions = {
    headerTitle: lan.t('my.settings')
  };
    // 构造
    constructor(props) {
        super(props);
        // 初始状态
        this.state = {
        };
    }

    componentDidMount(){

    }


    render() {
    return (
      <View style={{ flex: 1, backgroundColor: Theme.commonBackColor }}>
        {list.map((item, i) => (
          <ListItem
            onPress={() => item.onPress(this.props.navigation)}
            key={i}
            title={item.title}
            containerStyle={commonStyles.itemPadding}
            rightTitle={item.rightTitle}
            rightIcon={{ name: 'keyboard-arrow-right' }}
            bottomDivider={true}
            titleStyle={{fontSize:p(28),color:'#313131',fontWeight:'500'}}
          />
        ))}
      </View>
    );
  }
}
