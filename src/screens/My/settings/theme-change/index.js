/**
 * Created by zh on 2019/08/20.
 * 皮肤更换页面
 * Skin replacement page  '#0e9B71';// 078CEA
 */
import React, { Component } from 'react';
import { DeviceEventEmitter, View } from 'react-native';
import { CheckBox, ListItem, Divider, Button } from 'react-native-elements';
import Theme from '../../../../styles/theme';
import commonStyles from '../../../../styles/commonStyles';

const colorList = [
  {
    key: 0,
    title: 'Classic/#f4511E',
    value: '#f4511E'
  },
  {
    key: 1,
    title: 'Green/#00868B',
    value: '#00868B'
  },
  {
    key: 2,
    title: 'Red/#EE0000',
    value: '#EE0000'
  },
  {
    key: 3,
    title: 'Blue/#078CEA',
    value: '#078CEA'
  },
  {
    key: 4,
    title: 'Black/#0e9B71',
    value: '#0e9B71'
  },
    {
        key: 4,
        title: 'Black/#000000',
        value: '#000000'
    }
];

export default class ThemeChange extends Component {
  static navigationOptions = {
    headerTitle: lan.t('sett.skin')
  };

  render() {
    const currentColor = this.props.screenProps.themeColor;
    return (
      <View style={{ flex: 1, backgroundColor: Theme.commonBackColor }}>
        <Divider style={{ backgroundColor: 'black', marginTop: 30 }} />
        {colorList.map(item => (
          <CheckBox
            key={item.key}
            textStyle={{ color: '#ffffff' }}
            checkedColor={'#ffffff'}
            containerStyle={{
              backgroundColor: item.value
            }}
            title={item.title}
            checked={currentColor === item.value}
            onPress={() => {
              DeviceEventEmitter.emit('theme_change', item.value);
            }}
          />
        ))}
        <Divider style={{ backgroundColor: 'black', marginBottom: 30 }} />
        <ListItem
          containerStyle={commonStyles.itemPadding}
          title={lan.t('sett.custom')}
          bottomDivider={true}
          input={{
            placeholder: '#ffffff/white',
            onChangeText: text => {
              if (text.length > 3) {
                DeviceEventEmitter.emit('theme_change', text);
              }
            },
            inputStyle: {
              paddingTop: 0,
              alignItems: 'center',
              fontSize: 15
            }
          }}
        />
        <Button
          icon={{
            name: 'done',
            color: 'white'
          }}
          buttonStyle={{
            marginTop: 15,
            backgroundColor: this.props.screenProps.themeColor
          }}
          title={lan.t('confirm')}
          onPress={() => this.props.navigation.pop()}
        />
      </View>
    );
  }
}
