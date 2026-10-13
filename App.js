
import React, { Component } from 'react';

// 导航路由表
import RootStack from './src/routers/index';
import {
  View,
  Platform,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from "react-native";
import Loading from './src/common/loading';
import { Provider } from 'react-redux';
import configureStore from './src/common/redux/store/store';
import { PersistGate } from 'redux-persist/integration/react';
import SplashScreen from 'react-native-splash-screen';
import DeviceInfo from 'react-native-device-info';
import I18n from "react-native-i18n";
import CodePush from 'react-native-code-push';
import {CHAIN_LIST} from './src/blockchain/ChainInfo';
let codePushOptions = {
  //设置检查更新的频率
  //ON_APP_RESUME APP恢复到前台的时候
  //ON_APP_START APP开启的时候
  //MANUAL 手动检查
  checkFrequency: CodePush.CheckFrequency.MANUAL
};

// 引入 redux 及 redux-persist 配置后的变量供使用
const { store, persist } = configureStore();
export default class App extends Component {
  constructor(props) {
    super(props);
    CodePush.disallowRestart();
    this.state = {
      EthTokenList:[],
      color: '#229276',
      modalVisible:false,
      isMandatory: false,
      isUpdate: false,
      updateInfo: {},
      progress: 0
    };
  }
  syncImmediate() {
    let deploymentKey = Platform.OS === 'ios'?"4gp0BnKAvRafsasvrW7FimfIB4EH4ksvOXqog":'B0wYzOzbGgekxZmF2roQh4RspJt24ksvOXqog';
    CodePush.checkForUpdate().then((update) => {
      if (update) {
        this.setState({
          modalVisible: true,
          updateInfo: update,
          isMandatory: update.isMandatory
        })
      }else{
        CodePush.notifyAppReady()
      }
    }).catch(err => {
      alert(err)
    });
  }
  //开始更新
  _immediateUpdate() {
      this.setState({isUpdate: true})
      let deploymentKey = Platform.OS === 'ios'?"4gp0BnKAvRafsasvrW7FimfIB4EH4ksvOXqog":'B0wYzOzbGgekxZmF2roQh4RspJt24ksvOXqog';
      CodePush.sync( {
            deploymentKey: deploymentKey,
            updateDialog: false,
            installMode: CodePush.InstallMode.IMMEDIATE
          },
          this.codePushStatusDidChange,
          this.codePushDownloadDidProgress
      );
  }
  // 计算下载进度
  codePushDownloadDidProgress = (Progress) => {
    if (this.state.isUpdate) {
      let currProgress = Math.round((Progress.receivedBytes / Progress.totalBytes) * 100)/100;
      if(currProgress >= 1) {
        this.setState({modalVisible: false})
      } else {
        this.setState({
          progress:currProgress
        })
      }
    }
  }
  // 下载状态变化,监听状态变化，当更新出错时，提示更新失败信息并关闭面板
  codePushStatusDidChange = (syncStatus) => {
    if (this.state.isUpdate) {
      switch(syncStatus) {
        case CodePush.SyncStatus.CHECKING_FOR_UPDATE:
          //this.syncMessage = 'Checking for update'
          break;
        case CodePush.SyncStatus.DOWNLOADING_PACKAGE:
          //this.syncMessage = 'Downloading package'
          break;
        case CodePush.SyncStatus.AWAITING_USER_ACTION:
          //this.syncMessage = 'Awaiting user action'
          break;
        case CodePush.SyncStatus.INSTALLING_UPDATE:
          //this.syncMessage = 'Installing update'
          break;
        case CodePush.SyncStatus.UP_TO_DATE:
          //this.syncMessage = 'App up to date.'
          break;
        case CodePush.SyncStatus.UPDATE_IGNORED:
          //this.syncMessage = 'Update cancelled by user'
          break;
        case CodePush.SyncStatus.UPDATE_INSTALLED:
          //this.syncMessage = 'Update installed and will be applied on restart.'
          break;
        case CodePush.SyncStatus.UNKNOWN_ERROR:
          //this.syncMessage = 'An unknown error occurred'
          // 当更新出错时，提示信息并关闭面板
          Toast.info('更新出错，请重启应用！');
          this.setState({modalVisible: false})
          break;
      }
    }
  }

  appUpdateVersion(){
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    const currentVersionCode = parseInt(DeviceInfo.getBuildNumber(), 10);
    if(!currentVersionCode || currentVersionCode <= 0) return;
    const url = 'https://api.sparkfh.xyz/api/app/version/check?platform='
      + platform + '&current_version_code=' + currentVersionCode;
    fetch(url)
      .then((response) => response.json())
      .then((body) => {
        if(!body || Number(body.status_code) !== 200 || !body.data) return;
        const latest = body.data.latest_version;
        const latestCode = latest ? parseInt(latest.version_code, 10) : NaN;
        if(!latest || !latest.download_url || !isFinite(latestCode) || latestCode === currentVersionCode) return;
        const versionName = latest.version_name || '';
        const downloadUrl = latest.download_url;
        setTimeout(() => {
          SplashScreen.hide();
          this.setState({
            modalVisible: true,
            updateInfo: {
              versionName: versionName,
              downloadUrl: downloadUrl,
            },
          });
        }, 600);
      })
      .catch(() => {});
  }

  openUpdateUrl = async (url) => {
    Linking.openURL(url);
  };
  componentDidMount() {
    SplashScreen.hide(); // 隐藏启动屏
    //CodePush.allowRestart();//在加载完了，允许重启
    //this.syncImmediate(); //开始检查更新
    this.appUpdateVersion();

    let that = this;

    //设置公链连接
    storage.load({
      key: 'UseChain'
    }).then(data => {
    }).catch(e=>{
      that.saveChainInfo()
    })
    //设置语言
    storage.load({
      key: 'language'
    }).then(data => {
      I18n.locale = data;
    }).catch(e=>{
      I18n.locale = 'en';
    })
  }
  saveChainInfo(){
    storage.save({
      key: 'UseChain',
      data: CHAIN_LIST[defaultBlockChain],
    });
    global.useChainInfo = CHAIN_LIST[defaultBlockChain]
  }
  render(){
    let {updateInfo, modalVisible} = this.state;
    const versionName = updateInfo && updateInfo.versionName;
    return (
        <Provider store={store}>
         {modalVisible ? <Modal
              animationType="fade"
              transparent={true}
              visible={true}
              onRequestClose={() => this.setState({modalVisible: false})}
          >
          <View style={styles.mask}>
            <View style={styles.card}>
              <Text style={styles.title}>{lan.t('update.title')}</Text>
              {versionName ? <Text style={styles.version}>V{versionName}</Text> : null}
              <Text style={styles.message}>{lan.t('update.message')}</Text>
              <View style={styles.actions}>
                <TouchableOpacity
                    style={styles.laterBtn}
                    activeOpacity={0.8}
                    onPress={() => this.setState({modalVisible: false})}>
                  <Text style={styles.laterText}>{lan.t('update.later')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.nowBtn}
                    activeOpacity={0.8}
                    onPress={() => this.openUpdateUrl(updateInfo.downloadUrl)}>
                  <Text style={styles.nowText}>{lan.t('update.now')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          </Modal> : null}
          <PersistGate loading={null} persistor={persist}>
            <View style={{ flex: 1 }}>
              <RootStack
                  screenProps={{
                    themeColor: Theme.themeColor,
                    titleColor: '#ffffff',
                  }}
              />
              <Loading />
            </View>
          </PersistGate>
        </Provider>
    );
  }
}
const styles = StyleSheet.create({
  mask: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: p(60),
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: p(28),
    paddingTop: p(48),
    paddingBottom: p(36),
    paddingHorizontal: p(36),
    alignItems: 'center',
  },
  title: {
    fontSize: p(36),
    fontWeight: '600',
    color: '#242424',
  },
  version: {
    marginTop: p(16),
    fontSize: p(28),
    fontWeight: '600',
    color: '#c59405',
  },
  message: {
    marginTop: p(28),
    fontSize: p(28),
    lineHeight: p(44),
    color: '#666666',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    marginTop: p(40),
    width: '100%',
  },
  laterBtn: {
    flex: 1,
    height: p(84),
    borderRadius: p(42),
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: p(16),
  },
  nowBtn: {
    flex: 1,
    height: p(84),
    borderRadius: p(42),
    backgroundColor: '#efb405',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: p(16),
  },
  laterText: {
    fontSize: p(28),
    color: '#333333',
    fontWeight: '500',
  },
  nowText: {
    fontSize: p(28),
    color: '#1a1a1a',
    fontWeight: '600',
  },
});

// 这一行必须要写
App = CodePush(codePushOptions)(App)
