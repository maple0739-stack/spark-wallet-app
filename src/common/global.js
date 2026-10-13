import {Dimensions, Platform} from 'react-native'
// 屏幕适配
import {scaleSize, setSpText} from '../utils/ScreenUtil';
import Theme from '../styles/theme';
import {Toast} from 'teaset';
import storage from '../utils/AsyncStorage';
import Loading from '../common/loading';
import AjaxAction from '../actions/AjaxAction';
import utils from '../utils/utils';
import I18n from '../language/i18n';
import DeviceInfo from 'react-native-device-info';

import * as BlockChainService from '../blockchain/BlockChainService';
// 通过系统API获得屏幕宽高
let {height, width} = Dimensions.get('window');
global.lan = I18n;
global.Theme = Theme;
global.Toast = Toast;
global.storage = storage;
global.Loading = Loading;
global.utils = utils;
// 屏幕适配
global.p = scaleSize;
// 字体适配
global.tp = setSpText;
global.themeColor = '#202230';//
// 获取0x4e5949d55979bc62115d576e7707c3a7580a206a屏幕宽度
global.WIDTH = width;
// 获取屏幕高度
global.HEIGHT = height;
// 获取系统信息
global.IOS = Platform.OS !== 'android';

//标题字体大小和颜色
global.titleTextColor = '#2f2f2f';
global.titleTextSize = p(26);
//描述字体大小和颜色
global.describeColor = '#5f5f5f';
global.describeSize = p(24);
//按钮高度
global.buttonHeight = p(80);
global.buttonWidth = WIDTH - p(50);

//false 测试环境 true 正式环境
global.BlockChainService=BlockChainService;
global.AjaxAction=AjaxAction;
//当前钱包余额
global.walletAddress = "";//钱包地址
global.walletPrivateKey = "";//私钥
global.walletPassword = "";//密码
global.useChainInfo = "";//当前公链

global.appVersion=DeviceInfo.getVersion() || '1.0.0';
global.androidUrl='';
global.iosUrl='';

global.appName = "SPARK";
global.BnbGwei = 1;
global.EthGwei = 10;

global.defaultBlockChain = "BNB"

global.isKline = true
global.isSwap = true
