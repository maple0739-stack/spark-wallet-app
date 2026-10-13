import React, {Component} from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {Input} from 'react-native-elements';
import {Head} from '../../common/Head';
import {Button} from '../../common/Button';
import commonStyles from '../../styles/commonStyles';

export default class UpdatePayPassword extends Component {
  constructor(props) {
    super(props);
    this.state = {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
      showOld: false,
      showNew: false,
      showConfirm: false,
    };
  }

  static navigationOptions = {
    header: null
  };

  submit() {
    let {oldPassword, newPassword, confirmPassword} = this.state;
    if (!oldPassword || !newPassword || !confirmPassword) {
      Toast.info(lan.t('wallet.enterPwd'));
      return;
    }
    if (oldPassword !== walletPassword) {
      Toast.info(lan.t('wallet.passwordError'));
      return;
    }
    if (newPassword !== confirmPassword) {
      Toast.info(lan.t('wallet.twoPassword'));
      return;
    }
    if (newPassword.length < 8) {
      Toast.info(lan.t('wal.shezhiqianbaomima'));
      return;
    }
    this.updatePassword(newPassword);
  }

  updatePassword(newPassword) {
    storage.load({
      key: 'UseWallet'
    }).then(useWallet => {
      useWallet.password = newPassword;
      storage.save({
        key: 'UseWallet',
        data: useWallet
      });
      storage.save({
        key: 'walletPassword',
        data: {walletPassword: newPassword}
      });
      global.walletPassword = newPassword;
      storage.load({
        key: 'WalletInfoList'
      }).then(list => {
        let walletNewList = (list || []).map(item => {
          if (item.address === useWallet.address) {
            return {...item, password: newPassword};
          }
          return item;
        });
        storage.save({
          key: 'WalletInfoList',
          data: walletNewList,
        });
        Toast.success(lan.t('pay.updateSuccess'));
        this.props.navigation.goBack();
      }).catch(() => {
        Toast.success(lan.t('pay.updateSuccess'));
        this.props.navigation.goBack();
      });
    }).catch(() => {
      Toast.info(lan.t('wallet.passwordError'));
    });
  }

  renderInput(label, valueKey, showKey) {
    let show = this.state[showKey];
    return (
      <View>
        <Text style={styles.label}>{label}</Text>
        <Input
          placeholder={lan.t('pay.enterPwd')}
          secureTextEntry={!show}
          value={this.state[valueKey]}
          inputStyle={{...commonStyles.inputContent, marginLeft: 0}}
          inputContainerStyle={styles.inputBox}
          leftIconContainerStyle={styles.leftIconBox}
          rightIconContainerStyle={styles.rightIconBox}
          leftIcon={
            <Image source={require('../../resource/image/spark/keys.png')} style={styles.keyIcon}/>
          }
          rightIcon={
            <TouchableOpacity onPress={() => this.setState({[showKey]: !show})}>
              <AntDesign name={show ? 'eye' : 'eyeo'} size={20} color="#9A9A9A"/>
            </TouchableOpacity>
          }
          onChangeText={(text) => this.setState({[valueKey]: text})}
        />
      </View>
    );
  }

  render() {
    return (
      <View style={{flex: 1, backgroundColor: Theme.backgroundColor}}>
        <Head
          text={lan.t('pay.updateTitle')}
          leftOnPress={() => this.props.navigation.goBack()}
        />
        <View style={{width: WIDTH - p(40), marginLeft: p(20), marginTop: p(20)}}>
          {this.renderInput(lan.t('pay.currentPwd'), 'oldPassword', 'showOld')}
          {this.renderInput(lan.t('pay.newPwd'), 'newPassword', 'showNew')}
          {this.renderInput(lan.t('pay.confirmNewPwd'), 'confirmPassword', 'showConfirm')}
          <Button
            marginTop={p(80)}
            marginBottom={p(50)}
            text={lan.t('pay.submit')}
            onPress={() => this.submit()}
          />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  label: {
    fontSize: p(28),
    color: '#131313',
    fontWeight: '600',
    marginTop: p(40),
    marginLeft: p(10),
    marginBottom: p(16),
  },
  inputBox: {
    borderWidth: p(1),
    borderColor: '#E7E7E7',
    borderRadius: p(20),
    paddingLeft: p(8),
    paddingRight: p(10),
    height: p(90),
  },
  leftIconBox: {
    marginLeft: 0,
    marginRight: p(6),
  },
  rightIconBox: {
    marginRight: 0,
  },
  keyIcon: {
    width: p(50),
    height: p(50),
  },
});
