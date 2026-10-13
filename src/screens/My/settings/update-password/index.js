/**
 * Created by zh on 2019/09/06.
 * 修改密码页面
 * update password page
 */
import React, { Component } from 'react';
import { View } from 'react-native';
import { Button, ListItem } from 'react-native-elements';
import Theme from '../../../../styles/theme';
import commonStyles from '../../../../styles/commonStyles';
import Toast from '../../../../components/toast';

let _this;
export default class UpdatePassword extends Component {
  constructor(props) {
    super(props);
    _this = this;
    this.state = {
      userInfo: {},
      saveButtonShow: false
    };
  }

  static navigationOptions = {
    headerTitle: '修改密码'
  };

  componentDidMount() {
    // this.setState({ userInfo: userInfo });
  }



  render() {
    return (
      <View style={{ flex: 1, backgroundColor: Theme.commonBackColor }}>


      </View>
    );
  }
}
